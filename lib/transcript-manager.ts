/**
 * 转录管理器 - 处理转录内容的编辑、保存、导出等功能
 */

import { TranscriptSegment } from '@/types';

export interface ExportOptions {
  format: 'txt' | 'md' | 'docx' | 'json' | 'srt' | 'vtt';
  includeTimestamps: boolean;
  includeTranslations: boolean;
  includeSpeakerInfo: boolean;
  includeLanguageInfo: boolean;
  includeMetadata: boolean;
  targetLanguage?: 'zh' | 'en' | 'ms';
}

export interface SearchOptions {
  query: string;
  caseSensitive: boolean;
  wholeWord: boolean;
  includeTranslations: boolean;
  speakerId?: string;
  language?: 'zh' | 'en' | 'ms';
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface SearchResult {
  segmentId: string;
  segment: TranscriptSegment;
  matches: {
    content: boolean;
    translation: boolean;
    speaker: boolean;
  };
  highlightedContent: string;
}

export interface TranscriptStats {
  totalSegments: number;
  totalWords: number;
  languageDistribution: { [key: string]: number };
  speakerDistribution: { [key: string]: number };
  averageConfidence: number;
  duration: number; // in seconds
  codeSwitchingFrequency: number;
}

export class TranscriptManager {
  private transcripts: TranscriptSegment[] = [];
  private undoStack: TranscriptSegment[][] = [];
  private redoStack: TranscriptSegment[][] = [];
  private maxUndoSteps = 50;

  constructor(initialTranscripts: TranscriptSegment[] = []) {
    this.transcripts = [...initialTranscripts];
  }

  /**
   * 添加转录片段
   */
  addSegment(segment: TranscriptSegment): void {
    this.saveState();
    this.transcripts.push(segment);
  }

  /**
   * 添加多个转录片段
   */
  addSegments(segments: TranscriptSegment[]): void {
    this.saveState();
    this.transcripts.push(...segments);
  }

  /**
   * 更新转录片段
   */
  updateSegment(segmentId: string, updates: Partial<TranscriptSegment>): boolean {
    const index = this.transcripts.findIndex(segment => segment.id === segmentId);
    if (index === -1) return false;

    this.saveState();
    this.transcripts[index] = { ...this.transcripts[index], ...updates };
    return true;
  }

  /**
   * 删除转录片段
   */
  deleteSegment(segmentId: string): boolean {
    const index = this.transcripts.findIndex(segment => segment.id === segmentId);
    if (index === -1) return false;

    this.saveState();
    this.transcripts.splice(index, 1);
    return true;
  }

  /**
   * 合并转录片段
   */
  mergeSegments(segmentIds: string[]): boolean {
    if (segmentIds.length < 2) return false;

    const segments = segmentIds
      .map(id => this.transcripts.find(s => s.id === id))
      .filter(s => s !== undefined) as TranscriptSegment[];

    if (segments.length !== segmentIds.length) return false;

    this.saveState();

    // 创建合并后的片段
    const mergedSegment: TranscriptSegment = {
      id: `merged-${Date.now()}`,
      speakerId: segments[0].speakerId,
      content: segments.map(s => s.content).join(' '),
      timestamp: segments[0].timestamp,
      languageData: {
        detectedLanguages: segments[0].languageData.detectedLanguages,
        primaryLanguage: segments[0].languageData.primaryLanguage,
        confidence: segments.reduce((sum, s) => sum + s.languageData.confidence, 0) / segments.length,
        translations: this.mergeTranslations(segments),
        culturalNotes: segments.flatMap(s => s.languageData.culturalNotes || []),
      },
      metadata: {
        ...segments[0].metadata,
        isMerged: true,
        originalSegmentIds: segmentIds,
      },
    };

    // 删除原始片段并添加合并后的片段
    this.transcripts = this.transcripts.filter(s => !segmentIds.includes(s.id));
    this.transcripts.push(mergedSegment);
    this.transcripts.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return true;
  }

  /**
   * 分割转录片段
   */
  splitSegment(segmentId: string, splitIndex: number): boolean {
    const segment = this.transcripts.find(s => s.id === segmentId);
    if (!segment || splitIndex <= 0 || splitIndex >= segment.content.length) return false;

    this.saveState();

    const firstPart = segment.content.substring(0, splitIndex).trim();
    const secondPart = segment.content.substring(splitIndex).trim();

    const firstSegment: TranscriptSegment = {
      ...segment,
      id: `${segment.id}-1`,
      content: firstPart,
    };

    const secondSegment: TranscriptSegment = {
      ...segment,
      id: `${segment.id}-2`,
      content: secondPart,
      timestamp: new Date(segment.timestamp.getTime() + 1000), // 增加1秒
    };

    // 替换原片段
    const index = this.transcripts.findIndex(s => s.id === segmentId);
    this.transcripts.splice(index, 1, firstSegment, secondSegment);

    return true;
  }

  /**
   * 搜索转录内容
   */
  search(options: SearchOptions): SearchResult[] {
    const results: SearchResult[] = [];
    const regex = new RegExp(
      options.wholeWord ? `\\b${options.query}\\b` : options.query,
      options.caseSensitive ? 'g' : 'gi'
    );

    for (const segment of this.transcripts) {
      // 过滤条件检查
      if (options.speakerId && segment.speakerId !== options.speakerId) continue;
      if (options.language && segment.languageData.primaryLanguage !== options.language) continue;
      if (options.dateRange) {
        const segmentTime = segment.timestamp.getTime();
        const startTime = options.dateRange.start.getTime();
        const endTime = options.dateRange.end.getTime();
        if (segmentTime < startTime || segmentTime > endTime) continue;
      }

      const matches = {
        content: false,
        translation: false,
        speaker: false,
      };

      let highlightedContent = segment.content;

      // 搜索内容
      if (regex.test(segment.content)) {
        matches.content = true;
        highlightedContent = segment.content.replace(regex, '<mark>$&</mark>');
      }

      // 搜索翻译
      if (options.includeTranslations && segment.languageData.translations) {
        for (const translation of Object.values(segment.languageData.translations)) {
          if (regex.test(translation)) {
            matches.translation = true;
            break;
          }
        }
      }

      // 搜索说话人
      if (regex.test(segment.speakerId)) {
        matches.speaker = true;
      }

      if (matches.content || matches.translation || matches.speaker) {
        results.push({
          segmentId: segment.id,
          segment,
          matches,
          highlightedContent,
        });
      }
    }

    return results;
  }

  /**
   * 导出转录内容
   */
  async export(options: ExportOptions): Promise<string | Blob> {
    switch (options.format) {
      case 'txt':
        return this.exportToText(options);
      case 'md':
        return this.exportToMarkdown(options);
      case 'json':
        return this.exportToJSON(options);
      case 'srt':
        return this.exportToSRT(options);
      case 'vtt':
        return this.exportToVTT(options);
      case 'docx':
        return this.exportToDocx(options);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * 导出为纯文本
   */
  private exportToText(options: ExportOptions): string {
    let content = '';
    
    if (options.includeMetadata) {
      const stats = this.getStatistics();
      content += `会议转录统计\n`;
      content += `总段数: ${stats.totalSegments}\n`;
      content += `总词数: ${stats.totalWords}\n`;
      content += `平均置信度: ${Math.round(stats.averageConfidence * 100)}%\n`;
      content += `时长: ${Math.round(stats.duration / 60)}分钟\n\n`;
    }

    for (const segment of this.transcripts) {
      let line = '';
      
      if (options.includeTimestamps) {
        line += `[${this.formatTimestamp(segment.timestamp)}] `;
      }
      
      if (options.includeSpeakerInfo) {
        line += `${this.getSpeakerName(segment.speakerId)}: `;
      }
      
      line += segment.content;
      
      if (options.includeLanguageInfo) {
        line += ` (${segment.languageData.primaryLanguage.toUpperCase()})`;
      }
      
      content += line + '\n';
      
      if (options.includeTranslations && segment.languageData.translations) {
        for (const [lang, translation] of Object.entries(segment.languageData.translations)) {
          if (options.targetLanguage && lang !== options.targetLanguage) continue;
          content += `  翻译 (${lang.toUpperCase()}): ${translation}\n`;
        }
      }
      
      content += '\n';
    }
    
    return content;
  }

  /**
   * 导出为 Markdown
   */
  private exportToMarkdown(options: ExportOptions): string {
    let content = '# 会议转录\n\n';
    
    if (options.includeMetadata) {
      const stats = this.getStatistics();
      content += '## 统计信息\n\n';
      content += `- **总段数**: ${stats.totalSegments}\n`;
      content += `- **总词数**: ${stats.totalWords}\n`;
      content += `- **平均置信度**: ${Math.round(stats.averageConfidence * 100)}%\n`;
      content += `- **时长**: ${Math.round(stats.duration / 60)}分钟\n\n`;
    }
    
    content += '## 转录内容\n\n';
    
    for (const segment of this.transcripts) {
      let line = '';
      
      if (options.includeSpeakerInfo) {
        line += `**${this.getSpeakerName(segment.speakerId)}**`;
      }
      
      if (options.includeTimestamps) {
        line += ` *${this.formatTimestamp(segment.timestamp)}*`;
      }
      
      if (options.includeLanguageInfo) {
        line += ` \`${segment.languageData.primaryLanguage.toUpperCase()}\``;
      }
      
      if (line) line += ': ';
      
      line += segment.content;
      
      content += line + '\n\n';
      
      if (options.includeTranslations && segment.languageData.translations) {
        content += '> **翻译**:\n';
        for (const [lang, translation] of Object.entries(segment.languageData.translations)) {
          if (options.targetLanguage && lang !== options.targetLanguage) continue;
          content += `> - **${lang.toUpperCase()}**: ${translation}\n`;
        }
        content += '\n';
      }
    }
    
    return content;
  }

  /**
   * 导出为 JSON
   */
  private exportToJSON(options: ExportOptions): string {
    const exportData = {
      metadata: options.includeMetadata ? this.getStatistics() : undefined,
      transcripts: this.transcripts.map(segment => ({
        id: segment.id,
        speakerId: options.includeSpeakerInfo ? segment.speakerId : undefined,
        content: segment.content,
        timestamp: options.includeTimestamps ? segment.timestamp.toISOString() : undefined,
        languageData: options.includeLanguageInfo ? segment.languageData : undefined,
        translations: options.includeTranslations ? segment.languageData.translations : undefined,
      })),
      exportOptions: options,
      exportTime: new Date().toISOString(),
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * 导出为 SRT 字幕
   */
  private exportToSRT(options: ExportOptions): string {
    let content = '';
    
    for (let i = 0; i < this.transcripts.length; i++) {
      const segment = this.transcripts[i];
      const nextSegment = this.transcripts[i + 1];
      
      const startTime = this.formatSRTTimestamp(segment.timestamp);
      const endTime = nextSegment 
        ? this.formatSRTTimestamp(new Date(nextSegment.timestamp.getTime() - 1000))
        : this.formatSRTTimestamp(new Date(segment.timestamp.getTime() + 3000));
      
      content += `${i + 1}\n`;
      content += `${startTime} --> ${endTime}\n`;
      
      let text = segment.content;
      if (options.includeSpeakerInfo) {
        text = `${this.getSpeakerName(segment.speakerId)}: ${text}`;
      }
      
      content += `${text}\n\n`;
    }
    
    return content;
  }

  /**
   * 导出为 VTT 字幕
   */
  private exportToVTT(options: ExportOptions): string {
    let content = 'WEBVTT\n\n';
    
    for (let i = 0; i < this.transcripts.length; i++) {
      const segment = this.transcripts[i];
      const nextSegment = this.transcripts[i + 1];
      
      const startTime = this.formatVTTTimestamp(segment.timestamp);
      const endTime = nextSegment 
        ? this.formatVTTTimestamp(new Date(nextSegment.timestamp.getTime() - 1000))
        : this.formatVTTTimestamp(new Date(segment.timestamp.getTime() + 3000));
      
      content += `${startTime} --> ${endTime}\n`;
      
      let text = segment.content;
      if (options.includeSpeakerInfo) {
        text = `<v ${this.getSpeakerName(segment.speakerId)}>${text}`;
      }
      
      content += `${text}\n\n`;
    }
    
    return content;
  }

  /**
   * 导出为 DOCX (模拟)
   */
  private async exportToDocx(options: ExportOptions): Promise<Blob> {
    // 在实际实现中，这里会使用 docx 库来生成真正的 Word 文档
    const textContent = this.exportToText(options);
    return new Blob([textContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  }

  /**
   * 获取统计信息
   */
  getStatistics(): TranscriptStats {
    const totalSegments = this.transcripts.length;
    const totalWords = this.transcripts.reduce((sum, segment) => 
      sum + segment.content.split(/\s+/).length, 0
    );
    
    const languageDistribution: { [key: string]: number } = {};
    const speakerDistribution: { [key: string]: number } = {};
    let totalConfidence = 0;
    let codeSwitches = 0;
    
    for (let i = 0; i < this.transcripts.length; i++) {
      const segment = this.transcripts[i];
      const prevSegment = this.transcripts[i - 1];
      
      // 语言分布
      const lang = segment.languageData.primaryLanguage;
      languageDistribution[lang] = (languageDistribution[lang] || 0) + 1;
      
      // 说话人分布
      speakerDistribution[segment.speakerId] = (speakerDistribution[segment.speakerId] || 0) + 1;
      
      // 置信度
      totalConfidence += segment.languageData.confidence;
      
      // 代码切换
      if (prevSegment && prevSegment.languageData.primaryLanguage !== lang) {
        codeSwitches++;
      }
    }
    
    const duration = totalSegments > 0 
      ? (this.transcripts[totalSegments - 1].timestamp.getTime() - this.transcripts[0].timestamp.getTime()) / 1000
      : 0;
    
    return {
      totalSegments,
      totalWords,
      languageDistribution,
      speakerDistribution,
      averageConfidence: totalSegments > 0 ? totalConfidence / totalSegments : 0,
      duration,
      codeSwitchingFrequency: totalSegments > 1 ? codeSwitches / (totalSegments - 1) : 0,
    };
  }

  /**
   * 撤销操作
   */
  undo(): boolean {
    if (this.undoStack.length === 0) return false;
    
    this.redoStack.push([...this.transcripts]);
    this.transcripts = this.undoStack.pop()!;
    return true;
  }

  /**
   * 重做操作
   */
  redo(): boolean {
    if (this.redoStack.length === 0) return false;
    
    this.undoStack.push([...this.transcripts]);
    this.transcripts = this.redoStack.pop()!;
    return true;
  }

  /**
   * 保存当前状态到撤销栈
   */
  private saveState(): void {
    this.undoStack.push([...this.transcripts]);
    if (this.undoStack.length > this.maxUndoSteps) {
      this.undoStack.shift();
    }
    this.redoStack = []; // 清空重做栈
  }

  /**
   * 合并翻译内容
   */
  private mergeTranslations(segments: TranscriptSegment[]): { [key: string]: string } {
    const merged: { [key: string]: string } = {};
    
    for (const segment of segments) {
      if (segment.languageData.translations) {
        for (const [lang, translation] of Object.entries(segment.languageData.translations)) {
          if (!merged[lang]) {
            merged[lang] = translation;
          } else {
            merged[lang] += ' ' + translation;
          }
        }
      }
    }
    
    return merged;
  }

  /**
   * 格式化时间戳
   */
  private formatTimestamp(date: Date): string {
    return date.toLocaleTimeString('zh-CN', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  }

  /**
   * 格式化 SRT 时间戳
   */
  private formatSRTTimestamp(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const milliseconds = date.getMilliseconds().toString().padStart(3, '0');
    return `${hours}:${minutes}:${seconds},${milliseconds}`;
  }

  /**
   * 格式化 VTT 时间戳
   */
  private formatVTTTimestamp(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const milliseconds = date.getMilliseconds().toString().padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
  }

  /**
   * 获取说话人姓名
   */
  private getSpeakerName(speakerId: string): string {
    const speakers: { [key: string]: string } = {
      'speaker1': 'John Doe',
      'speaker2': 'Jane Smith',
    };
    return speakers[speakerId] || speakerId;
  }

  /**
   * 获取所有转录
   */
  getTranscripts(): TranscriptSegment[] {
    return [...this.transcripts];
  }

  /**
   * 获取特定片段
   */
  getSegment(segmentId: string): TranscriptSegment | undefined {
    return this.transcripts.find(segment => segment.id === segmentId);
  }

  /**
   * 清空所有转录
   */
  clear(): void {
    this.saveState();
    this.transcripts = [];
  }

  /**
   * 设置转录内容
   */
  setTranscripts(transcripts: TranscriptSegment[]): void {
    this.saveState();
    this.transcripts = [...transcripts];
  }

  /**
   * 获取撤销/重做状态
   */
  getUndoRedoState(): { canUndo: boolean; canRedo: boolean } {
    return {
      canUndo: this.undoStack.length > 0,
      canRedo: this.redoStack.length > 0,
    };
  }
}
