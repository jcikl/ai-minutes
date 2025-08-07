/**
 * 语音识别钩子
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  SpeechRecognitionManager, 
  SpeechRecognitionResult,
  getSpeechLanguageCode 
} from '@/lib/speech-recognition';

export interface UseSpeechRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  language?: 'zh' | 'en' | 'ms';
  autoStart?: boolean;
}

export interface UseSpeechRecognitionReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  finalTranscript: string;
  confidence: number;
  detectedLanguage: string | null;
  error: string | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
  setLanguage: (lang: 'zh' | 'en' | 'ms') => void;
  reset: () => void;
}

export const useSpeechRecognition = (
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn => {
  const {
    continuous = true,
    interimResults = true,
    language = 'en',
    autoStart = false,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recognitionManagerRef = useRef<SpeechRecognitionManager | null>(null);
  const currentLanguageRef = useRef(language);

  /**
   * 初始化语音识别管理器
   */
  const initializeRecognition = useCallback(() => {
    try {
      if (recognitionManagerRef.current) {
        recognitionManagerRef.current.destroy();
      }

      const speechLanguageCode = getSpeechLanguageCode(currentLanguageRef.current);
      
      recognitionManagerRef.current = new SpeechRecognitionManager({
        language: speechLanguageCode,
        continuous,
        interimResults,
        maxAlternatives: 3,
      });

      const manager = recognitionManagerRef.current;

      // 设置结果回调
      manager.onResult((result: SpeechRecognitionResult) => {
        setError(null);
        setConfidence(result.confidence);
        
        if (result.detectedLanguage) {
          setDetectedLanguage(result.detectedLanguage);
        }

        if (result.isFinal) {
          setFinalTranscript(prev => prev + result.transcript + ' ');
          setTranscript(prev => prev + result.transcript + ' ');
          setInterimTranscript('');
        } else {
          setInterimTranscript(result.transcript);
          setTranscript(finalTranscript + result.transcript);
        }
      });

      // 设置错误回调
      manager.onError((errorMessage: string) => {
        setError(errorMessage);
        setIsListening(false);
        console.error('语音识别错误:', errorMessage);
      });

      setIsSupported(manager.isSupported());

      if (autoStart && manager.isSupported()) {
        setTimeout(() => start(), 100);
      }

    } catch (err) {
      console.error('初始化语音识别失败:', err);
      setError('初始化语音识别失败');
      setIsSupported(false);
    }
  }, [continuous, interimResults, autoStart, finalTranscript]);

  /**
   * 开始语音识别
   */
  const start = useCallback(() => {
    if (!recognitionManagerRef.current?.isSupported()) {
      setError('浏览器不支持语音识别');
      return;
    }

    if (isListening) {
      return;
    }

    try {
      recognitionManagerRef.current.start();
      setIsListening(true);
      setError(null);
    } catch (err) {
      setError('启动语音识别失败');
      setIsListening(false);
    }
  }, [isListening]);

  /**
   * 停止语音识别
   */
  const stop = useCallback(() => {
    if (!recognitionManagerRef.current || !isListening) {
      return;
    }

    try {
      recognitionManagerRef.current.stop();
      setIsListening(false);
    } catch (err) {
      setError('停止语音识别失败');
    }
  }, [isListening]);

  /**
   * 中止语音识别
   */
  const abort = useCallback(() => {
    if (!recognitionManagerRef.current) {
      return;
    }

    try {
      recognitionManagerRef.current.abort();
      setIsListening(false);
      setInterimTranscript('');
    } catch (err) {
      setError('中止语音识别失败');
    }
  }, []);

  /**
   * 设置语言
   */
  const setLanguage = useCallback((lang: 'zh' | 'en' | 'ms') => {
    currentLanguageRef.current = lang;
    
    if (recognitionManagerRef.current) {
      const speechLanguageCode = getSpeechLanguageCode(lang);
      recognitionManagerRef.current.setLanguage(speechLanguageCode);
    }
  }, []);

  /**
   * 重置转录内容
   */
  const reset = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setFinalTranscript('');
    setConfidence(0);
    setDetectedLanguage(null);
    setError(null);
  }, []);

  /**
   * 初始化
   */
  useEffect(() => {
    initializeRecognition();

    return () => {
      if (recognitionManagerRef.current) {
        recognitionManagerRef.current.destroy();
        recognitionManagerRef.current = null;
      }
    };
  }, [initializeRecognition]);

  /**
   * 语言变化时重新初始化
   */
  useEffect(() => {
    if (recognitionManagerRef.current && currentLanguageRef.current !== language) {
      setLanguage(language);
    }
  }, [language, setLanguage]);

  /**
   * 清理资源
   */
  useEffect(() => {
    return () => {
      if (recognitionManagerRef.current) {
        recognitionManagerRef.current.destroy();
      }
    };
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    finalTranscript,
    confidence,
    detectedLanguage,
    error,
    start,
    stop,
    abort,
    setLanguage,
    reset,
  };
};
