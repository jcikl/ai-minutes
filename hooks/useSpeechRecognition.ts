/**
 * 语音识别钩子
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  SpeechRecognitionManager, 
  SpeechRecognitionResult,
  getSpeechLanguageCode 
} from '@/lib/speech-recognition';
import { MockSpeechGenerator } from '@/lib/mock-speech-data';

export interface UseSpeechRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  language?: 'zh' | 'en' | 'ms';
  autoStart?: boolean;
  testMode?: boolean;
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
    testMode = false,
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
  const mockGeneratorRef = useRef<MockSpeechGenerator | null>(null);
  const currentLanguageRef = useRef(language);

  /**
   * 初始化语音识别管理器
   */
  const initializeRecognition = useCallback(() => {
    try {
      if (testMode) {
        // 测试模式：初始化模拟生成器
        const handleMockSpeech = (text: string, language: 'zh' | 'en' | 'ms', speaker: string) => {
          setError(null);
          setConfidence(0.9);
          setDetectedLanguage(language);
          
          // 模拟最终结果
          setFinalTranscript(prev => prev + text + ' ');
          setTranscript(prev => prev + text + ' ');
          setInterimTranscript('');
        };

        mockGeneratorRef.current = new MockSpeechGenerator(handleMockSpeech);
        setIsSupported(true);
        console.log('测试模式：模拟语音识别初始化成功');
        
        if (autoStart) {
          setTimeout(() => start(), 100);
        }
        return;
      }

      // 正常模式：初始化真实语音识别
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
  }, [continuous, interimResults, autoStart, finalTranscript, testMode]);

  /**
   * 开始语音识别
   */
  const start = useCallback(() => {
    if (isListening) {
      return;
    }

    if (testMode) {
      // 测试模式：启动模拟生成器
      if (mockGeneratorRef.current) {
        mockGeneratorRef.current.start();
        setIsListening(true);
        setError(null);
        console.log('测试模式：开始模拟语音识别');
      }
      return;
    }

    // 正常模式
    if (!recognitionManagerRef.current?.isSupported()) {
      setError('浏览器不支持语音识别');
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
  }, [isListening, testMode]);

  /**
   * 停止语音识别
   */
  const stop = useCallback(() => {
    if (!isListening) {
      return;
    }

    if (testMode) {
      // 测试模式：停止模拟生成器
      if (mockGeneratorRef.current) {
        mockGeneratorRef.current.stop();
        setIsListening(false);
        console.log('测试模式：停止模拟语音识别');
      }
      return;
    }

    // 正常模式
    if (!recognitionManagerRef.current) {
      return;
    }

    try {
      recognitionManagerRef.current.stop();
      setIsListening(false);
    } catch (err) {
      setError('停止语音识别失败');
    }
  }, [isListening, testMode]);

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
