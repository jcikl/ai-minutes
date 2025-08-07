/**
 * 多语言检测器 - 基于文本内容、语音模式和用户行为的智能语言检测
 */

export interface LanguageDetectionResult {
  detectedLanguage: 'zh' | 'en' | 'ms' | 'mixed';
  confidence: number;
  languageBreakdown: {
    zh: number;
    en: number;
    ms: number;
  };
  codeSwitchingPoints?: number[];
  culturalMarkers?: string[];
}

export interface LanguagePattern {
  language: 'zh' | 'en' | 'ms';
  patterns: RegExp[];
  commonWords: string[];
  linguisticFeatures: string[];
}

export class LanguageDetector {
  private patterns: LanguagePattern[] = [
    {
      language: 'zh',
      patterns: [
        /[\u4e00-\u9fff]/g, // 中文字符
        /[，。！？；：""'']/g, // 中文标点
      ],
      commonWords: [
        '的', '了', '是', '我', '你', '他', '她', '它', '我们', '你们', '他们',
        '这', '那', '有', '在', '和', '与', '但是', '然后', '因为', '所以',
        '什么', '怎么', '为什么', '哪里', '什么时候', '谁', '今天', '明天', '昨天'
      ],
      linguisticFeatures: ['tone_markers', 'chinese_grammar']
    },
    {
      language: 'en',
      patterns: [
        /\b(the|a|an|and|or|but|in|on|at|to|for|of|with|by)\b/gi,
        /\b(I|you|he|she|it|we|they|this|that|these|those)\b/gi,
        /\b(what|where|when|why|how|who)\b/gi,
      ],
      commonWords: [
        'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'I',
        'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
        'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she'
      ],
      linguisticFeatures: ['articles', 'auxiliary_verbs']
    },
    {
      language: 'ms',
      patterns: [
        /\b(yang|dan|atau|dengan|untuk|ini|itu|adalah|tidak|ada)\b/gi,
        /\b(saya|anda|dia|mereka|kita|kami|awak)\b/gi,
        /\b(apa|mana|bila|mengapa|bagaimana|siapa)\b/gi,
      ],
      commonWords: [
        'yang', 'dan', 'atau', 'dengan', 'untuk', 'ini', 'itu', 'adalah', 'tidak', 'ada',
        'saya', 'anda', 'dia', 'mereka', 'kita', 'kami', 'awak', 'pada', 'dalam', 'ke',
        'apa', 'mana', 'bila', 'mengapa', 'bagaimana', 'siapa', 'hari', 'masa', 'tahun'
      ],
      linguisticFeatures: ['agglutination', 'reduplication']
    }
  ];

  private languageHistory: { language: string; timestamp: Date; confidence: number }[] = [];
  private maxHistorySize = 50;

  /**
   * 检测文本的主要语言
   */
  detectLanguage(text: string, options: {
    useHistory?: boolean;
    detectCodeSwitching?: boolean;
    minConfidence?: number;
  } = {}): LanguageDetectionResult {
    const {
      useHistory = true,
      detectCodeSwitching = true,
      minConfidence = 0.3
    } = options;

    if (!text || text.trim().length === 0) {
      return {
        detectedLanguage: 'en',
        confidence: 0,
        languageBreakdown: { zh: 0, en: 0, ms: 0 },
      };
    }

    const cleanText = this.preprocessText(text);
    const scores = this.calculateLanguageScores(cleanText);
    const breakdown = this.normalizeScores(scores);
    
    // 主要语言检测
    const primaryLanguage = this.getPrimaryLanguage(breakdown, minConfidence);
    
    // 混合语言检测
    const isMixed = this.detectMixedLanguage(breakdown);
    
    // 代码切换检测
    let codeSwitchingPoints: number[] = [];
    if (detectCodeSwitching) {
      codeSwitchingPoints = this.detectCodeSwitching(cleanText);
    }

    // 文化标记检测
    const culturalMarkers = this.detectCulturalMarkers(cleanText);

    // 计算整体置信度
    const confidence = this.calculateConfidence(breakdown, primaryLanguage, useHistory);

    const result: LanguageDetectionResult = {
      detectedLanguage: isMixed ? 'mixed' : primaryLanguage,
      confidence,
      languageBreakdown: breakdown,
      codeSwitchingPoints: codeSwitchingPoints.length > 0 ? codeSwitchingPoints : undefined,
      culturalMarkers: culturalMarkers.length > 0 ? culturalMarkers : undefined,
    };

    // 更新历史记录
    if (useHistory) {
      this.updateHistory(result.detectedLanguage, confidence);
    }

    return result;
  }

  /**
   * 预处理文本
   */
  private preprocessText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\u4e00-\u9fff\w\s]/g, ' ') // 保留中文、字母、数字和空格
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * 计算各语言得分
   */
  private calculateLanguageScores(text: string): { zh: number; en: number; ms: number } {
    const scores = { zh: 0, en: 0, ms: 0 };
    const words = text.split(/\s+/);

    for (const pattern of this.patterns) {
      const lang = pattern.language;
      
      // 基于正则模式的得分
      for (const regex of pattern.patterns) {
        const matches = text.match(regex);
        if (matches) {
          scores[lang] += matches.length * 2;
        }
      }

      // 基于常见词汇的得分
      for (const word of words) {
        if (pattern.commonWords.includes(word)) {
          scores[lang] += 3;
        }
      }

      // 特殊语言特征
      if (lang === 'zh') {
        // 中文字符权重更高
        const chineseChars = text.match(/[\u4e00-\u9fff]/g);
        if (chineseChars) {
          scores[lang] += chineseChars.length * 5;
        }
      }

      if (lang === 'ms') {
        // 马来语特有的后缀和前缀
        const malayAffixes = text.match(/\b(me|ber|ter|ke|pe|per|di|se)[\w]+/g);
        if (malayAffixes) {
          scores[lang] += malayAffixes.length * 2;
        }
      }
    }

    return scores;
  }

  /**
   * 标准化得分
   */
  private normalizeScores(scores: { zh: number; en: number; ms: number }): { zh: number; en: number; ms: number } {
    const total = scores.zh + scores.en + scores.ms;
    
    if (total === 0) {
      return { zh: 0, en: 1, ms: 0 }; // 默认英语
    }

    return {
      zh: scores.zh / total,
      en: scores.en / total,
      ms: scores.ms / total,
    };
  }

  /**
   * 获取主要语言
   */
  private getPrimaryLanguage(
    breakdown: { zh: number; en: number; ms: number }, 
    minConfidence: number
  ): 'zh' | 'en' | 'ms' {
    const maxScore = Math.max(breakdown.zh, breakdown.en, breakdown.ms);
    
    if (maxScore < minConfidence) {
      return 'en'; // 默认语言
    }

    if (breakdown.zh === maxScore) return 'zh';
    if (breakdown.en === maxScore) return 'en';
    return 'ms';
  }

  /**
   * 检测混合语言
   */
  private detectMixedLanguage(breakdown: { zh: number; en: number; ms: number }): boolean {
    const values = Object.values(breakdown);
    const sortedValues = values.sort((a, b) => b - a);
    
    // 如果第二高的分数超过30%，认为是混合语言
    return sortedValues[1] > 0.3;
  }

  /**
   * 检测代码切换点
   */
  private detectCodeSwitching(text: string): number[] {
    const words = text.split(/\s+/);
    const switchingPoints: number[] = [];
    let currentLanguage: string | null = null;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const wordLang = this.detectWordLanguage(word);
      
      if (currentLanguage && wordLang !== currentLanguage) {
        switchingPoints.push(i);
      }
      
      currentLanguage = wordLang;
    }

    return switchingPoints;
  }

  /**
   * 检测单词语言
   */
  private detectWordLanguage(word: string): string {
    if (/[\u4e00-\u9fff]/.test(word)) return 'zh';
    
    for (const pattern of this.patterns) {
      if (pattern.commonWords.includes(word.toLowerCase())) {
        return pattern.language;
      }
    }
    
    return 'en'; // 默认
  }

  /**
   * 检测文化标记
   */
  private detectCulturalMarkers(text: string): string[] {
    const markers: string[] = [];
    
    // 中文文化标记
    const chineseMarkers = [
      '春节', '中秋', '端午', '清明', '国庆', '元宵',
      '老板', '师傅', '阿姨', '叔叔', '哥哥', '姐姐',
      '茶', '粥', '包子', '饺子', '面条'
    ];
    
    // 马来文化标记
    const malayMarkers = [
      'hari raya', 'ramadan', 'chinese new year', 'deepavali',
      'mak', 'pak', 'kak', 'abang', 'adik',
      'nasi', 'mee', 'roti', 'teh', 'kopi'
    ];
    
    // 英语文化标记
    const englishMarkers = [
      'christmas', 'thanksgiving', 'easter', 'halloween',
      'sir', 'madam', 'mr', 'mrs', 'ms',
      'coffee', 'tea', 'breakfast', 'lunch', 'dinner'
    ];
    
    const allMarkers = [
      ...chineseMarkers.map(m => ({ marker: m, culture: 'chinese' })),
      ...malayMarkers.map(m => ({ marker: m, culture: 'malay' })),
      ...englishMarkers.map(m => ({ marker: m, culture: 'western' }))
    ];
    
    for (const { marker, culture } of allMarkers) {
      if (text.includes(marker)) {
        markers.push(`${culture}:${marker}`);
      }
    }
    
    return markers;
  }

  /**
   * 计算置信度
   */
  private calculateConfidence(
    breakdown: { zh: number; en: number; ms: number },
    primaryLanguage: 'zh' | 'en' | 'ms',
    useHistory: boolean
  ): number {
    let confidence = breakdown[primaryLanguage];
    
    // 基于历史的置信度调整
    if (useHistory && this.languageHistory.length > 0) {
      const recentHistory = this.languageHistory.slice(-10);
      const historicalConfidence = recentHistory
        .filter(h => h.language === primaryLanguage)
        .reduce((sum, h) => sum + h.confidence, 0) / recentHistory.length;
      
      // 加权平均
      confidence = confidence * 0.7 + historicalConfidence * 0.3;
    }
    
    return Math.min(confidence, 1);
  }

  /**
   * 更新语言历史
   */
  private updateHistory(language: string, confidence: number): void {
    this.languageHistory.push({
      language,
      timestamp: new Date(),
      confidence
    });
    
    // 限制历史记录大小
    if (this.languageHistory.length > this.maxHistorySize) {
      this.languageHistory = this.languageHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * 获取语言统计
   */
  getLanguageStatistics(): {
    distribution: { zh: number; en: number; ms: number };
    codeSwitchingFrequency: number;
    averageConfidence: number;
  } {
    if (this.languageHistory.length === 0) {
      return {
        distribution: { zh: 0, en: 1, ms: 0 },
        codeSwitchingFrequency: 0,
        averageConfidence: 0
      };
    }

    const languageCounts = { zh: 0, en: 0, ms: 0 };
    let totalConfidence = 0;
    let switches = 0;
    let lastLanguage: string | null = null;

    for (const entry of this.languageHistory) {
      if (entry.language !== 'mixed') {
        languageCounts[entry.language as keyof typeof languageCounts]++;
      }
      totalConfidence += entry.confidence;
      
      if (lastLanguage && lastLanguage !== entry.language) {
        switches++;
      }
      lastLanguage = entry.language;
    }

    const total = languageCounts.zh + languageCounts.en + languageCounts.ms;
    
    return {
      distribution: {
        zh: total > 0 ? languageCounts.zh / total : 0,
        en: total > 0 ? languageCounts.en / total : 1,
        ms: total > 0 ? languageCounts.ms / total : 0,
      },
      codeSwitchingFrequency: switches / Math.max(this.languageHistory.length - 1, 1),
      averageConfidence: totalConfidence / this.languageHistory.length
    };
  }

  /**
   * 清除历史记录
   */
  clearHistory(): void {
    this.languageHistory = [];
  }
}
