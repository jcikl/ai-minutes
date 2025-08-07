/**
 * 翻译服务 - 支持多种翻译引擎和离线翻译
 */

export interface TranslationRequest {
  text: string;
  from: 'zh' | 'en' | 'ms' | 'auto';
  to: 'zh' | 'en' | 'ms';
  context?: string;
  formality?: 'formal' | 'informal';
}

export interface TranslationResult {
  translatedText: string;
  confidence: number;
  detectedSourceLanguage?: string;
  alternatives?: string[];
  contextualNotes?: string[];
  culturalAdaptations?: string[];
  processingTime: number;
}

export interface TranslationEngine {
  name: string;
  isOnline: boolean;
  supportedLanguages: string[];
  translate(request: TranslationRequest): Promise<TranslationResult>;
  isAvailable(): Promise<boolean>;
}

/**
 * 离线翻译引擎（基于预定义词典和规则）
 */
class OfflineTranslationEngine implements TranslationEngine {
  name = 'Offline Dictionary';
  isOnline = false;
  supportedLanguages = ['zh', 'en', 'ms'];

  private dictionaries = {
    'zh-en': new Map([
      ['你好', 'hello'],
      ['再见', 'goodbye'],
      ['谢谢', 'thank you'],
      ['对不起', 'sorry'],
      ['是的', 'yes'],
      ['不是', 'no'],
      ['会议', 'meeting'],
      ['议程', 'agenda'],
      ['今天', 'today'],
      ['明天', 'tomorrow'],
      ['项目', 'project'],
      ['团队', 'team'],
      ['工作', 'work'],
      ['任务', 'task'],
      ['完成', 'complete'],
      ['开始', 'start'],
      ['结束', 'end'],
      ['讨论', 'discuss'],
      ['决定', 'decide'],
      ['计划', 'plan'],
    ]),
    'en-zh': new Map([
      ['hello', '你好'],
      ['goodbye', '再见'],
      ['thank you', '谢谢'],
      ['sorry', '对不起'],
      ['yes', '是的'],
      ['no', '不是'],
      ['meeting', '会议'],
      ['agenda', '议程'],
      ['today', '今天'],
      ['tomorrow', '明天'],
      ['project', '项目'],
      ['team', '团队'],
      ['work', '工作'],
      ['task', '任务'],
      ['complete', '完成'],
      ['start', '开始'],
      ['end', '结束'],
      ['discuss', '讨论'],
      ['decide', '决定'],
      ['plan', '计划'],
    ]),
    'ms-en': new Map([
      ['selamat pagi', 'good morning'],
      ['selamat petang', 'good afternoon'],
      ['terima kasih', 'thank you'],
      ['maaf', 'sorry'],
      ['ya', 'yes'],
      ['tidak', 'no'],
      ['mesyuarat', 'meeting'],
      ['agenda', 'agenda'],
      ['hari ini', 'today'],
      ['esok', 'tomorrow'],
      ['projek', 'project'],
      ['pasukan', 'team'],
      ['kerja', 'work'],
      ['tugasan', 'task'],
      ['siap', 'complete'],
      ['mula', 'start'],
      ['tamat', 'end'],
    ]),
    'en-ms': new Map([
      ['good morning', 'selamat pagi'],
      ['good afternoon', 'selamat petang'],
      ['thank you', 'terima kasih'],
      ['sorry', 'maaf'],
      ['yes', 'ya'],
      ['no', 'tidak'],
      ['meeting', 'mesyuarat'],
      ['agenda', 'agenda'],
      ['today', 'hari ini'],
      ['tomorrow', 'esok'],
      ['project', 'projek'],
      ['team', 'pasukan'],
      ['work', 'kerja'],
      ['task', 'tugasan'],
      ['complete', 'siap'],
      ['start', 'mula'],
      ['end', 'tamat'],
    ]),
    'zh-ms': new Map([
      ['你好', 'hello / hai'],
      ['谢谢', 'terima kasih'],
      ['会议', 'mesyuarat'],
      ['今天', 'hari ini'],
      ['项目', 'projek'],
      ['工作', 'kerja'],
    ]),
    'ms-zh': new Map([
      ['terima kasih', '谢谢'],
      ['mesyuarat', '会议'],
      ['hari ini', '今天'],
      ['projek', '项目'],
      ['kerja', '工作'],
    ]),
  };

  async translate(request: TranslationRequest): Promise<TranslationResult> {
    const startTime = Date.now();
    
    try {
      const { text, from, to } = request;
      const sourceLanguage = from === 'auto' ? this.detectLanguage(text) : from;
      const dictionaryKey = `${sourceLanguage}-${to}` as keyof typeof this.dictionaries;
      const dictionary = this.dictionaries[dictionaryKey];
      
      if (!dictionary) {
        throw new Error(`Unsupported language pair: ${sourceLanguage} -> ${to}`);
      }

      let translatedText = text.toLowerCase();
      let confidence = 0.3; // 基础置信度
      const alternatives: string[] = [];
      const contextualNotes: string[] = [];

      // 词汇替换
      for (const [source, target] of dictionary.entries()) {
        if (translatedText.includes(source.toLowerCase())) {
          translatedText = translatedText.replace(
            new RegExp(source.toLowerCase(), 'gi'), 
            target
          );
          confidence += 0.2;
        }
      }

      // 如果没有找到匹配的词汇，尝试保持原文
      if (confidence <= 0.3) {
        translatedText = `[${text}]`; // 标记为未翻译
        contextualNotes.push('部分内容无法翻译，保持原文');
        confidence = 0.1;
      }

      // 添加文化适应性说明
      const culturalAdaptations = this.getCulturalAdaptations(text, sourceLanguage, to);

      return {
        translatedText: this.capitalizeFirstLetter(translatedText),
        confidence: Math.min(confidence, 1),
        detectedSourceLanguage: sourceLanguage,
        alternatives,
        contextualNotes,
        culturalAdaptations,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        translatedText: text, // 失败时返回原文
        confidence: 0,
        contextualNotes: ['翻译失败，显示原文'],
        processingTime: Date.now() - startTime,
      };
    }
  }

  private detectLanguage(text: string): 'zh' | 'en' | 'ms' {
    if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
    if (/\b(yang|dan|atau|dengan|ini|itu)\b/i.test(text)) return 'ms';
    return 'en';
  }

  private capitalizeFirstLetter(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  private getCulturalAdaptations(text: string, from: string, to: string): string[] {
    const adaptations: string[] = [];
    
    // 中英文化适应
    if (from === 'zh' && to === 'en') {
      if (text.includes('老板')) {
        adaptations.push('在西方文化中，可能更倾向于使用"manager"或"supervisor"');
      }
      if (text.includes('师傅')) {
        adaptations.push('西方文化中通常称为"expert"或"specialist"');
      }
    }
    
    // 英马文化适应
    if (from === 'en' && to === 'ms') {
      if (text.includes('sir') || text.includes('madam')) {
        adaptations.push('马来文化中更常用"encik"或"puan"作为敬称');
      }
    }
    
    return adaptations;
  }

  async isAvailable(): Promise<boolean> {
    return true; // 离线翻译始终可用
  }
}

/**
 * Web Translation API 引擎（模拟在线翻译服务）
 */
class WebTranslationEngine implements TranslationEngine {
  name = 'Web Translation API';
  isOnline = true;
  supportedLanguages = ['zh', 'en', 'ms'];

  async translate(request: TranslationRequest): Promise<TranslationResult> {
    const startTime = Date.now();
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    
    try {
      // 在实际应用中，这里会调用真实的翻译API
      // 现在我们模拟一个更智能的翻译结果
      const { text, from, to } = request;
      
      const mockTranslations = {
        'zh-en': {
          '你好，今天会议的议程是什么？': 'Hello, what is the agenda for today\'s meeting?',
          '我们需要讨论项目进度': 'We need to discuss the project progress',
          '这个任务预计明天完成': 'This task is expected to be completed tomorrow',
        },
        'en-zh': {
          'Hello, what is the agenda for today\'s meeting?': '你好，今天会议的议程是什么？',
          'We need to discuss the project progress': '我们需要讨论项目进度',
          'This task is expected to be completed tomorrow': '这个任务预计明天完成',
        },
        'ms-en': {
          'Apa agenda mesyuarat hari ini?': 'What is the agenda for today\'s meeting?',
          'Kita perlu bincang kemajuan projek': 'We need to discuss the project progress',
        },
        'en-ms': {
          'What is the agenda for today\'s meeting?': 'Apa agenda mesyuarat hari ini?',
          'We need to discuss the project progress': 'Kita perlu bincang kemajuan projek',
        },
      };
      
      const sourceLanguage = from === 'auto' ? this.detectLanguage(text) : from;
      const translationKey = `${sourceLanguage}-${to}` as keyof typeof mockTranslations;
      const translations = mockTranslations[translationKey];
      
      let translatedText = translations?.[text as keyof typeof translations] || text;
      let confidence = 0.9;
      
      // 如果没有预设翻译，使用基础翻译逻辑
      if (translatedText === text) {
        const offlineEngine = new OfflineTranslationEngine();
        const fallbackResult = await offlineEngine.translate(request);
        translatedText = fallbackResult.translatedText;
        confidence = fallbackResult.confidence * 0.8; // 降低置信度
      }

      return {
        translatedText,
        confidence,
        detectedSourceLanguage: sourceLanguage,
        alternatives: [text], // 原文作为备选
        contextualNotes: confidence < 0.7 ? ['翻译质量可能有限'] : [],
        culturalAdaptations: [],
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      throw new Error('在线翻译服务暂时不可用');
    }
  }

  private detectLanguage(text: string): 'zh' | 'en' | 'ms' {
    if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
    if (/\b(yang|dan|atau|dengan|ini|itu)\b/i.test(text)) return 'ms';
    return 'en';
  }

  async isAvailable(): Promise<boolean> {
    try {
      // 模拟网络检查
      await new Promise(resolve => setTimeout(resolve, 100));
      return Math.random() > 0.1; // 90% 成功率
    } catch {
      return false;
    }
  }
}

/**
 * 翻译服务管理器
 */
export class TranslationManager {
  private engines: TranslationEngine[] = [];
  private preferredEngine: TranslationEngine | null = null;
  private cache = new Map<string, TranslationResult>();
  private maxCacheSize = 100;

  constructor() {
    this.initializeEngines();
  }

  private initializeEngines(): void {
    this.engines = [
      new WebTranslationEngine(),
      new OfflineTranslationEngine(), // 备用引擎
    ];
  }

  /**
   * 翻译文本
   */
  async translate(request: TranslationRequest): Promise<TranslationResult> {
    const cacheKey = this.getCacheKey(request);
    
    // 检查缓存
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      return {
        ...cached,
        processingTime: 0, // 缓存命中
      };
    }

    // 选择可用的翻译引擎
    const engine = await this.selectEngine();
    
    try {
      const result = await engine.translate(request);
      
      // 缓存结果
      this.cacheResult(cacheKey, result);
      
      return result;
    } catch (error) {
      // 如果首选引擎失败，尝试备用引擎
      if (engine !== this.engines[this.engines.length - 1]) {
        const fallbackEngine = this.engines[this.engines.length - 1];
        try {
          const result = await fallbackEngine.translate(request);
          this.cacheResult(cacheKey, result);
          return result;
        } catch (fallbackError) {
          throw new Error('所有翻译引擎都不可用');
        }
      }
      throw error;
    }
  }

  /**
   * 批量翻译
   */
  async translateBatch(requests: TranslationRequest[]): Promise<TranslationResult[]> {
    const results = await Promise.allSettled(
      requests.map(request => this.translate(request))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          translatedText: requests[index].text,
          confidence: 0,
          contextualNotes: ['翻译失败'],
          processingTime: 0,
        };
      }
    });
  }

  /**
   * 选择最佳翻译引擎
   */
  private async selectEngine(): Promise<TranslationEngine> {
    if (this.preferredEngine && await this.preferredEngine.isAvailable()) {
      return this.preferredEngine;
    }

    for (const engine of this.engines) {
      if (await engine.isAvailable()) {
        this.preferredEngine = engine;
        return engine;
      }
    }

    throw new Error('没有可用的翻译引擎');
  }

  /**
   * 生成缓存键
   */
  private getCacheKey(request: TranslationRequest): string {
    return `${request.from}-${request.to}:${request.text}`;
  }

  /**
   * 缓存翻译结果
   */
  private cacheResult(key: string, result: TranslationResult): void {
    if (this.cache.size >= this.maxCacheSize) {
      // 删除最旧的缓存项
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, result);
  }

  /**
   * 获取支持的语言对
   */
  getSupportedLanguagePairs(): Array<{ from: string; to: string }> {
    const languages = ['zh', 'en', 'ms'];
    const pairs: Array<{ from: string; to: string }> = [];
    
    for (const from of languages) {
      for (const to of languages) {
        if (from !== to) {
          pairs.push({ from, to });
        }
      }
    }
    
    return pairs;
  }

  /**
   * 获取翻译统计
   */
  getStatistics(): {
    cacheSize: number;
    preferredEngine: string;
    supportedLanguages: string[];
  } {
    return {
      cacheSize: this.cache.size,
      preferredEngine: this.preferredEngine?.name || 'None',
      supportedLanguages: ['zh', 'en', 'ms'],
    };
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
  }
}
