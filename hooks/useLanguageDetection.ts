/**
 * 语言检测钩子
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { LanguageDetector, LanguageDetectionResult } from '@/lib/language-detector';

export interface UseLanguageDetectionOptions {
  autoDetect?: boolean;
  minConfidence?: number;
  historySize?: number;
  debounceMs?: number;
}

export interface UseLanguageDetectionReturn {
  detectLanguage: (text: string) => LanguageDetectionResult;
  currentLanguage: 'zh' | 'en' | 'ms' | 'mixed';
  confidence: number;
  languageBreakdown: { zh: number; en: number; ms: number };
  codeSwitchingPoints: number[];
  culturalMarkers: string[];
  statistics: {
    distribution: { zh: number; en: number; ms: number };
    codeSwitchingFrequency: number;
    averageConfidence: number;
  };
  isDetecting: boolean;
  error: string | null;
  clearHistory: () => void;
  setAutoDetect: (enabled: boolean) => void;
}

export const useLanguageDetection = (
  options: UseLanguageDetectionOptions = {}
): UseLanguageDetectionReturn => {
  const {
    autoDetect = true,
    minConfidence = 0.3,
    historySize = 50,
    debounceMs = 300,
  } = options;

  const [currentLanguage, setCurrentLanguage] = useState<'zh' | 'en' | 'ms' | 'mixed'>('en');
  const [confidence, setConfidence] = useState(0);
  const [languageBreakdown, setLanguageBreakdown] = useState({ zh: 0, en: 1, ms: 0 });
  const [codeSwitchingPoints, setCodeSwitchingPoints] = useState<number[]>([]);
  const [culturalMarkers, setCulturalMarkers] = useState<string[]>([]);
  const [statistics, setStatistics] = useState({
    distribution: { zh: 0, en: 1, ms: 0 },
    codeSwitchingFrequency: 0,
    averageConfidence: 0,
  });
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoDetectEnabled, setAutoDetectEnabled] = useState(autoDetect);

  const detectorRef = useRef<LanguageDetector | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * 初始化语言检测器
   */
  useEffect(() => {
    try {
      detectorRef.current = new LanguageDetector();
      setError(null);
    } catch (err) {
      setError('语言检测器初始化失败');
      console.error('语言检测器初始化失败:', err);
    }
  }, []);

  /**
   * 更新统计数据
   */
  const updateStatistics = useCallback(() => {
    if (detectorRef.current) {
      const stats = detectorRef.current.getLanguageStatistics();
      setStatistics(stats);
    }
  }, []);

  /**
   * 处理检测结果
   */
  const handleDetectionResult = useCallback((result: LanguageDetectionResult) => {
    setCurrentLanguage(result.detectedLanguage);
    setConfidence(result.confidence);
    setLanguageBreakdown(result.languageBreakdown);
    setCodeSwitchingPoints(result.codeSwitchingPoints || []);
    setCulturalMarkers(result.culturalMarkers || []);
    updateStatistics();
    setIsDetecting(false);
    setError(null);
  }, [updateStatistics]);

  /**
   * 执行语言检测
   */
  const detectLanguage = useCallback((text: string): LanguageDetectionResult => {
    if (!detectorRef.current) {
      const fallbackResult: LanguageDetectionResult = {
        detectedLanguage: 'en',
        confidence: 0,
        languageBreakdown: { zh: 0, en: 1, ms: 0 },
      };
      return fallbackResult;
    }

    setIsDetecting(true);

    try {
      const result = detectorRef.current.detectLanguage(text, {
        useHistory: true,
        detectCodeSwitching: true,
        minConfidence,
      });

      handleDetectionResult(result);
      return result;
    } catch (err) {
      setError('语言检测失败');
      setIsDetecting(false);
      console.error('语言检测失败:', err);
      
      const errorResult: LanguageDetectionResult = {
        detectedLanguage: 'en',
        confidence: 0,
        languageBreakdown: { zh: 0, en: 1, ms: 0 },
      };
      return errorResult;
    }
  }, [minConfidence, handleDetectionResult]);

  /**
   * 防抖的语言检测
   */
  const debouncedDetectLanguage = useCallback((text: string) => {
    if (!autoDetectEnabled) return;

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      detectLanguage(text);
    }, debounceMs);
  }, [autoDetectEnabled, detectLanguage, debounceMs]);

  /**
   * 清除历史记录
   */
  const clearHistory = useCallback(() => {
    if (detectorRef.current) {
      detectorRef.current.clearHistory();
      setStatistics({
        distribution: { zh: 0, en: 1, ms: 0 },
        codeSwitchingFrequency: 0,
        averageConfidence: 0,
      });
      setCurrentLanguage('en');
      setConfidence(0);
      setLanguageBreakdown({ zh: 0, en: 1, ms: 0 });
      setCodeSwitchingPoints([]);
      setCulturalMarkers([]);
    }
  }, []);

  /**
   * 设置自动检测
   */
  const setAutoDetect = useCallback((enabled: boolean) => {
    setAutoDetectEnabled(enabled);
  }, []);

  /**
   * 清理定时器
   */
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    detectLanguage,
    currentLanguage,
    confidence,
    languageBreakdown,
    codeSwitchingPoints,
    culturalMarkers,
    statistics,
    isDetecting,
    error,
    clearHistory,
    setAutoDetect,
  };
};
