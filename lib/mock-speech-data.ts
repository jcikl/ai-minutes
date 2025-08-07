/**
 * 模拟语音数据 - 用于测试模式
 */

export interface MockSpeechSegment {
  text: string;
  language: 'zh' | 'en' | 'ms';
  speaker: string;
  delay: number; // 延迟时间（毫秒）
}

// 模拟的多语言会议对话
export const mockConversation: MockSpeechSegment[] = [
  {
    text: "Good morning everyone, let's start today's meeting.",
    language: 'en',
    speaker: 'speaker1',
    delay: 2000
  },
  {
    text: "早上好！今天我们讨论项目进展。",
    language: 'zh',
    speaker: 'speaker2',
    delay: 4000
  },
  {
    text: "Selamat pagi, saya akan memberikan laporan minggu ini.",
    language: 'ms',
    speaker: 'speaker1',
    delay: 6000
  },
  {
    text: "Let me share the current status of our AI project.",
    language: 'en',
    speaker: 'speaker1',
    delay: 8000
  },
  {
    text: "我们的语音识别功能已经基本完成了。",
    language: 'zh',
    speaker: 'speaker2',
    delay: 10000
  },
  {
    text: "Bagaimana dengan testing dan quality assurance?",
    language: 'ms',
    speaker: 'speaker1',
    delay: 12000
  },
  {
    text: "The testing phase will begin next week.",
    language: 'en',
    speaker: 'speaker2',
    delay: 14000
  },
  {
    text: "我们需要确保多语言切换功能正常工作。",
    language: 'zh',
    speaker: 'speaker2',
    delay: 16000
  },
  {
    text: "Ya, ini sangat penting untuk user experience.",
    language: 'ms',
    speaker: 'speaker1',
    delay: 18000
  },
  {
    text: "Any questions about the implementation?",
    language: 'en',
    speaker: 'speaker1',
    delay: 20000
  }
];

export class MockSpeechGenerator {
  private currentIndex = 0;
  private isRunning = false;
  private timeoutId: NodeJS.Timeout | null = null;
  private startTime = 0;

  constructor(private onSpeech: (text: string, language: 'zh' | 'en' | 'ms', speaker: string) => void) {}

  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.startTime = Date.now();
    this.currentIndex = 0;
    this.scheduleNext();
    console.log('开始模拟语音数据生成');
  }

  stop(): void {
    this.isRunning = false;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    console.log('停止模拟语音数据生成');
  }

  private scheduleNext(): void {
    if (!this.isRunning || this.currentIndex >= mockConversation.length) {
      // 重新开始循环
      this.currentIndex = 0;
    }

    const segment = mockConversation[this.currentIndex];
    
    this.timeoutId = setTimeout(() => {
      if (this.isRunning) {
        this.onSpeech(segment.text, segment.language, segment.speaker);
        this.currentIndex++;
        
        // 继续下一个，或者重新开始
        if (this.currentIndex < mockConversation.length) {
          this.scheduleNext();
        } else {
          // 等待一会儿然后重新开始
          this.timeoutId = setTimeout(() => {
            if (this.isRunning) {
              this.currentIndex = 0;
              this.scheduleNext();
            }
          }, 5000); // 5秒后重新开始
        }
      }
    }, segment.delay);
  }

  reset(): void {
    this.stop();
    this.currentIndex = 0;
  }
}
