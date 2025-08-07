/**
 * 语音识别服务 - 支持多种识别引擎
 */

export interface SpeechRecognitionConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
}

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  alternatives?: { transcript: string; confidence: number }[];
  detectedLanguage?: string;
  timestamp: Date;
}

export interface SpeechRecognitionEngine {
  name: string;
  isSupported: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  setLanguage(language: string): void;
  onResult: (callback: (result: SpeechRecognitionResult) => void) => void;
  onError: (callback: (error: string) => void) => void;
  onEnd: (callback: () => void) => void;
}

/**
 * Web Speech API 实现
 */
class WebSpeechEngine implements SpeechRecognitionEngine {
  name = 'Web Speech API';
  private recognition: any = null;
  private isListening = false;
  private resultCallback?: (result: SpeechRecognitionResult) => void;
  private errorCallback?: (error: string) => void;
  private endCallback?: () => void;

  constructor(private config: SpeechRecognitionConfig) {
    this.initialize();
  }

  get isSupported(): boolean {
    return !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;
  }

  private initialize(): void {
    if (!this.isSupported) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();

    this.recognition.continuous = this.config.continuous;
    this.recognition.interimResults = this.config.interimResults;
    this.recognition.maxAlternatives = this.config.maxAlternatives;
    this.recognition.lang = this.config.language;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.recognition) return;

    this.recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const alternatives = [];

        for (let j = 0; j < result.length; j++) {
          alternatives.push({
            transcript: result[j].transcript,
            confidence: result[j].confidence || 0,
          });
        }

        const speechResult: SpeechRecognitionResult = {
          transcript: result[0].transcript,
          confidence: result[0].confidence || 0,
          isFinal: result.isFinal,
          alternatives,
          timestamp: new Date(),
        };

        this.resultCallback?.(speechResult);
      }
    };

    this.recognition.onerror = (event: any) => {
      let errorMessage = '语音识别错误';
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = '未检测到语音';
          break;
        case 'audio-capture':
          errorMessage = '音频捕获失败';
          break;
        case 'not-allowed':
          errorMessage = '麦克风权限被拒绝';
          break;
        case 'network':
          errorMessage = '网络错误';
          break;
        case 'service-not-allowed':
          errorMessage = '语音识别服务不可用';
          break;
        default:
          errorMessage = `语音识别错误: ${event.error}`;
      }

      this.errorCallback?.(errorMessage);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.endCallback?.();
    };

    this.recognition.onstart = () => {
      this.isListening = true;
    };
  }

  start(): void {
    if (!this.recognition || this.isListening) return;
    
    try {
      this.recognition.start();
    } catch (error) {
      this.errorCallback?.('启动语音识别失败');
    }
  }

  stop(): void {
    if (!this.recognition || !this.isListening) return;
    this.recognition.stop();
  }

  abort(): void {
    if (!this.recognition) return;
    this.recognition.abort();
    this.isListening = false;
  }

  setLanguage(language: string): void {
    if (this.recognition) {
      this.recognition.lang = language;
    }
  }

  onResult(callback: (result: SpeechRecognitionResult) => void): void {
    this.resultCallback = callback;
  }

  onError(callback: (error: string) => void): void {
    this.errorCallback = callback;
  }

  onEnd(callback: () => void): void {
    this.endCallback = callback;
  }
}

/**
 * 语音识别管理器
 */
export class SpeechRecognitionManager {
  private engine: SpeechRecognitionEngine | null = null;
  private config: SpeechRecognitionConfig;
  private isActive = false;
  private resultCallback?: (result: SpeechRecognitionResult) => void;
  private errorCallback?: (error: string) => void;

  constructor(config: Partial<SpeechRecognitionConfig> = {}) {
    this.config = {
      language: 'zh-CN',
      continuous: true,
      interimResults: true,
      maxAlternatives: 3,
      ...config,
    };

    this.initializeEngine();
  }

  private initializeEngine(): void {
    // 优先使用 Web Speech API
    const webSpeechEngine = new WebSpeechEngine(this.config);
    if (webSpeechEngine.isSupported) {
      this.engine = webSpeechEngine;
      this.setupEngineCallbacks();
      return;
    }

    console.warn('没有可用的语音识别引擎');
  }

  private setupEngineCallbacks(): void {
    if (!this.engine) return;

    this.engine.onResult((result) => {
      // 语言检测增强
      const detectedLanguage = this.detectLanguage(result.transcript);
      result.detectedLanguage = detectedLanguage;
      
      this.resultCallback?.(result);
    });

    this.engine.onError((error) => {
      this.errorCallback?.(error);
    });

    this.engine.onEnd(() => {
      this.isActive = false;
      // 如果是连续识别模式，自动重启
      if (this.config.continuous && this.isActive) {
        setTimeout(() => this.start(), 100);
      }
    });
  }

  /**
   * 简单的语言检测
   */
  private detectLanguage(text: string): string {
    const chinesePattern = /[\u4e00-\u9fff]/;
    const malayPattern = /\b(yang|dan|atau|dengan|untuk|ini|itu|adalah|tidak|ada|saya|anda|mereka|dia)\b/i;
    
    if (chinesePattern.test(text)) {
      return 'zh';
    } else if (malayPattern.test(text)) {
      return 'ms';
    } else {
      return 'en';
    }
  }

  /**
   * 开始语音识别
   */
  start(): void {
    if (!this.engine) {
      this.errorCallback?.('语音识别引擎不可用');
      return;
    }

    if (this.isActive) {
      return;
    }

    this.isActive = true;
    this.engine.start();
  }

  /**
   * 停止语音识别
   */
  stop(): void {
    if (!this.engine || !this.isActive) return;

    this.isActive = false;
    this.engine.stop();
  }

  /**
   * 中止语音识别
   */
  abort(): void {
    if (!this.engine) return;

    this.isActive = false;
    this.engine.abort();
  }

  /**
   * 设置语言
   */
  setLanguage(language: string): void {
    this.config.language = language;
    this.engine?.setLanguage(language);
  }

  /**
   * 设置结果回调
   */
  onResult(callback: (result: SpeechRecognitionResult) => void): void {
    this.resultCallback = callback;
  }

  /**
   * 设置错误回调
   */
  onError(callback: (error: string) => void): void {
    this.errorCallback = callback;
  }

  /**
   * 获取支持的语言列表
   */
  getSupportedLanguages(): { code: string; name: string }[] {
    return [
      { code: 'zh-CN', name: '中文（简体）' },
      { code: 'zh-TW', name: '中文（繁体）' },
      { code: 'en-US', name: 'English (US)' },
      { code: 'en-GB', name: 'English (UK)' },
      { code: 'ms-MY', name: 'Bahasa Melayu' },
      { code: 'ms-BN', name: 'Bahasa Melayu (Brunei)' },
    ];
  }

  /**
   * 检查是否支持语音识别
   */
  isSupported(): boolean {
    return this.engine?.isSupported || false;
  }

  /**
   * 获取当前状态
   */
  getStatus(): {
    isActive: boolean;
    isSupported: boolean;
    currentLanguage: string;
    engineName: string;
  } {
    return {
      isActive: this.isActive,
      isSupported: this.isSupported(),
      currentLanguage: this.config.language,
      engineName: this.engine?.name || 'None',
    };
  }

  /**
   * 销毁语音识别管理器
   */
  destroy(): void {
    this.abort();
    this.engine = null;
    this.resultCallback = undefined;
    this.errorCallback = undefined;
  }
}

/**
 * 语言代码映射
 */
export const LANGUAGE_CODES = {
  zh: 'zh-CN',
  en: 'en-US',
  ms: 'ms-MY',
} as const;

/**
 * 获取语音识别语言代码
 */
export function getSpeechLanguageCode(lang: 'zh' | 'en' | 'ms'): string {
  return LANGUAGE_CODES[lang] || 'en-US';
}
