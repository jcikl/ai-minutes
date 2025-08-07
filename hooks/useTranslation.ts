/**
 * 翻译钩子
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  TranslationManager, 
  TranslationRequest, 
  TranslationResult 
} from '@/lib/translation-service';

export interface UseTranslationOptions {
  autoTranslate?: boolean;
  defaultTargetLanguage?: 'zh' | 'en' | 'ms';
  cacheEnabled?: boolean;
}

export interface UseTranslationReturn {
  translate: (request: TranslationRequest) => Promise<TranslationResult>;
  translateText: (text: string, from: 'zh' | 'en' | 'ms' | 'auto', to: 'zh' | 'en' | 'ms') => Promise<TranslationResult>;
  translateBatch: (requests: TranslationRequest[]) => Promise<TranslationResult[]>;
  isTranslating: boolean;
  error: string | null;
  statistics: {
    cacheSize: number;
    preferredEngine: string;
    supportedLanguages: string[];
  };
  clearCache: () => void;
  getSupportedLanguagePairs: () => Array<{ from: string; to: string }>;
}

export const useTranslation = (
  options: UseTranslationOptions = {}
): UseTranslationReturn => {
  const {
    autoTranslate = false,
    defaultTargetLanguage = 'en',
    cacheEnabled = true,
  } = options;

  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState({
    cacheSize: 0,
    preferredEngine: 'None',
    supportedLanguages: ['zh', 'en', 'ms'],
  });

  const translationManagerRef = useRef<TranslationManager | null>(null);
  const requestQueueRef = useRef<Map<string, Promise<TranslationResult>>>(new Map());

  /**
   * 初始化翻译管理器
   */
  useEffect(() => {
    try {
      translationManagerRef.current = new TranslationManager();
      updateStatistics();
      setError(null);
    } catch (err) {
      setError('翻译服务初始化失败');
      console.error('翻译服务初始化失败:', err);
    }
  }, []);

  /**
   * 更新统计信息
   */
  const updateStatistics = useCallback(() => {
    if (translationManagerRef.current) {
      const stats = translationManagerRef.current.getStatistics();
      setStatistics(stats);
    }
  }, []);

  /**
   * 翻译文本
   */
  const translate = useCallback(async (request: TranslationRequest): Promise<TranslationResult> => {
    if (!translationManagerRef.current) {
      throw new Error('翻译服务未初始化');
    }

    const requestKey = `${request.from}-${request.to}:${request.text}`;
    
    // 检查是否有相同的请求正在处理中
    if (requestQueueRef.current.has(requestKey)) {
      return requestQueueRef.current.get(requestKey)!;
    }

    setIsTranslating(true);
    setError(null);

    const translationPromise = (async () => {
      try {
        const result = await translationManagerRef.current!.translate(request);
        updateStatistics();
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '翻译失败';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsTranslating(false);
        requestQueueRef.current.delete(requestKey);
      }
    })();

    requestQueueRef.current.set(requestKey, translationPromise);
    return translationPromise;
  }, [updateStatistics]);

  /**
   * 简化的翻译文本方法
   */
  const translateText = useCallback(async (
    text: string, 
    from: 'zh' | 'en' | 'ms' | 'auto', 
    to: 'zh' | 'en' | 'ms'
  ): Promise<TranslationResult> => {
    return translate({
      text,
      from,
      to,
      formality: 'informal',
    });
  }, [translate]);

  /**
   * 批量翻译
   */
  const translateBatch = useCallback(async (requests: TranslationRequest[]): Promise<TranslationResult[]> => {
    if (!translationManagerRef.current) {
      throw new Error('翻译服务未初始化');
    }

    setIsTranslating(true);
    setError(null);

    try {
      const results = await translationManagerRef.current.translateBatch(requests);
      updateStatistics();
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '批量翻译失败';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsTranslating(false);
    }
  }, [updateStatistics]);

  /**
   * 清除缓存
   */
  const clearCache = useCallback(() => {
    if (translationManagerRef.current) {
      translationManagerRef.current.clearCache();
      updateStatistics();
    }
  }, [updateStatistics]);

  /**
   * 获取支持的语言对
   */
  const getSupportedLanguagePairs = useCallback(() => {
    if (translationManagerRef.current) {
      return translationManagerRef.current.getSupportedLanguagePairs();
    }
    return [];
  }, []);

  return {
    translate,
    translateText,
    translateBatch,
    isTranslating,
    error,
    statistics,
    clearCache,
    getSupportedLanguagePairs,
  };
};
