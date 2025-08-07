/**
 * 音频管理器 - 负责音频录制、处理和可视化
 */

export interface AudioConfig {
  sampleRate: number;
  channelCount: number;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
}

export interface AudioMetrics {
  volume: number;
  frequency: number[];
  pitch: number;
  quality: number;
  backgroundNoise: number;
}

export class AudioManager {
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private stream: MediaStream | null = null;
  private audioData: Float32Array = new Float32Array(1024);
  private isRecording = false;
  private recordedChunks: Blob[] = [];
  private isTestMode = false;
  private testInterval: NodeJS.Timeout | null = null;
  
  private readonly config: AudioConfig = {
    sampleRate: 16000,
    channelCount: 1,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  };

  /**
   * 初始化音频管理器
   */
  async initialize(testMode = false): Promise<void> {
    try {
      if (testMode || !navigator.mediaDevices) {
        return this.initializeTestMode();
      }

      // 请求麦克风权限
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.config.sampleRate,
          channelCount: this.config.channelCount,
          echoCancellation: this.config.echoCancellation,
          noiseSuppression: this.config.noiseSuppression,
          autoGainControl: this.config.autoGainControl,
        },
      });

      // 创建音频上下文和分析器
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;

      // 连接音频流到分析器
      const source = this.audioContext.createMediaStreamSource(this.stream);
      source.connect(this.analyser);

      // 创建媒体录制器
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: this.getSupportedMimeType(),
      });

      this.setupMediaRecorderEvents();

      console.log('音频管理器初始化成功');
    } catch (error) {
      console.error('音频管理器初始化失败:', error);
      console.log('尝试使用测试模式...');
      return this.initializeTestMode();
    }
  }

  /**
   * 初始化测试模式
   */
  private async initializeTestMode(): Promise<void> {
    this.isTestMode = true;
    console.log('使用测试模式（模拟音频输入）');
    
    // 模拟音频数据
    this.audioData = new Float32Array(1024);
    for (let i = 0; i < this.audioData.length; i++) {
      this.audioData[i] = Math.random() * 0.1; // 模拟低音量
    }
  }

  /**
   * 获取支持的音频格式
   */
  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return '';
  }

  /**
   * 设置媒体录制器事件
   */
  private setupMediaRecorderEvents(): void {
    if (!this.mediaRecorder) return;

    this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.onstop = () => {
      console.log('录制停止');
    };

    this.mediaRecorder.onerror = (event: any) => {
      console.error('录制错误:', event.error);
    };
  }

  /**
   * 开始录制
   */
  startRecording(): void {
    if (this.isRecording) return;

    if (this.isTestMode) {
      this.isRecording = true;
      console.log('开始测试模式录制');
      this.startTestRecording();
      return;
    }

    if (!this.mediaRecorder) return;

    this.recordedChunks = [];
    this.mediaRecorder.start(100); // 每100ms收集一次数据
    this.isRecording = true;
    console.log('开始录制');
  }

  /**
   * 开始测试模式录制
   */
  private startTestRecording(): void {
    // 模拟音频录制，每秒更新一次数据
    this.testInterval = setInterval(() => {
      // 生成模拟的音频数据
      for (let i = 0; i < this.audioData.length; i++) {
        this.audioData[i] = Math.random() * 0.3; // 模拟音频信号
      }
    }, 100);
  }

  /**
   * 停止录制
   */
  stopRecording(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.isRecording) {
        resolve(null);
        return;
      }

      if (this.isTestMode) {
        if (this.testInterval) {
          clearInterval(this.testInterval);
          this.testInterval = null;
        }
        this.isRecording = false;
        console.log('测试模式录制完成');
        // 返回一个模拟的音频blob
        const dummyBlob = new Blob(['dummy audio data'], { type: 'audio/webm' });
        resolve(dummyBlob);
        return;
      }

      if (!this.mediaRecorder) {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, {
          type: this.getSupportedMimeType(),
        });
        this.recordedChunks = [];
        this.isRecording = false;
        console.log('录制完成');
        resolve(blob);
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * 获取实时音频数据用于可视化
   */
  getAudioData(): number[] {
    if (this.isTestMode) {
      // 返回模拟的可视化数据
      const visualData: number[] = [];
      for (let i = 0; i < 20; i++) {
        // 生成模拟的频率数据，模拟语音模式
        const amplitude = Math.random() * 0.5 + 0.1; // 0.1 到 0.6 之间
        visualData.push(amplitude);
      }
      return visualData;
    }

    if (!this.analyser) return Array(20).fill(0);

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    // 将频域数据转换为可视化数据
    const visualData: number[] = [];
    const step = Math.floor(bufferLength / 20);

    for (let i = 0; i < 20; i++) {
      const start = i * step;
      const end = start + step;
      let sum = 0;

      for (let j = start; j < end && j < bufferLength; j++) {
        sum += dataArray[j];
      }

      visualData.push((sum / step) / 255); // 归一化到0-1
    }

    return visualData;
  }

  /**
   * 获取音频指标
   */
  getAudioMetrics(): AudioMetrics {
    if (!this.analyser) {
      return {
        volume: 0,
        frequency: [],
        pitch: 0,
        quality: 0,
        backgroundNoise: 0,
      };
    }

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const timeDomainArray = new Uint8Array(bufferLength);
    
    this.analyser.getByteFrequencyData(dataArray);
    this.analyser.getByteTimeDomainData(timeDomainArray);

    // 计算音量
    const volume = this.calculateVolume(timeDomainArray);
    
    // 计算频率分布
    const frequency = Array.from(dataArray).map(value => value / 255);
    
    // 估算音质
    const quality = this.estimateAudioQuality(dataArray);
    
    // 估算背景噪音
    const backgroundNoise = this.estimateBackgroundNoise(dataArray);
    
    // 估算基频
    const pitch = this.estimatePitch(timeDomainArray);

    return {
      volume,
      frequency,
      pitch,
      quality,
      backgroundNoise,
    };
  }

  /**
   * 计算音量
   */
  private calculateVolume(timeDomainData: Uint8Array): number {
    let sum = 0;
    for (let i = 0; i < timeDomainData.length; i++) {
      const sample = (timeDomainData[i] - 128) / 128;
      sum += sample * sample;
    }
    return Math.sqrt(sum / timeDomainData.length);
  }

  /**
   * 估算音质
   */
  private estimateAudioQuality(frequencyData: Uint8Array): number {
    // 基于频率分布的质量评估
    const highFreqStart = Math.floor(frequencyData.length * 0.7);
    const midFreqStart = Math.floor(frequencyData.length * 0.2);
    
    let highFreqSum = 0;
    let midFreqSum = 0;
    
    for (let i = midFreqStart; i < highFreqStart; i++) {
      midFreqSum += frequencyData[i];
    }
    
    for (let i = highFreqStart; i < frequencyData.length; i++) {
      highFreqSum += frequencyData[i];
    }
    
    const midFreqAvg = midFreqSum / (highFreqStart - midFreqStart);
    const highFreqAvg = highFreqSum / (frequencyData.length - highFreqStart);
    
    // 音质评分：中频能量强、高频噪音少
    return Math.min(1, midFreqAvg / 255 * (1 - highFreqAvg / 255));
  }

  /**
   * 估算背景噪音
   */
  private estimateBackgroundNoise(frequencyData: Uint8Array): number {
    // 基于低频能量估算背景噪音
    const lowFreqEnd = Math.floor(frequencyData.length * 0.1);
    let lowFreqSum = 0;
    
    for (let i = 0; i < lowFreqEnd; i++) {
      lowFreqSum += frequencyData[i];
    }
    
    return (lowFreqSum / lowFreqEnd) / 255;
  }

  /**
   * 估算基频（音调）
   */
  private estimatePitch(timeDomainData: Uint8Array): number {
    // 简化的基频检测算法
    let bestCorrelation = 0;
    let bestPeriod = 0;
    
    const minPeriod = 8; // 对应约2kHz
    const maxPeriod = 1000; // 对应约44Hz
    
    for (let period = minPeriod; period < maxPeriod; period++) {
      let correlation = 0;
      
      for (let i = 0; i < timeDomainData.length - period; i++) {
        correlation += Math.abs((timeDomainData[i] - 128) * (timeDomainData[i + period] - 128));
      }
      
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestPeriod = period;
      }
    }
    
    return bestPeriod > 0 ? (this.config.sampleRate / bestPeriod) : 0;
  }

  /**
   * 获取录制状态
   */
  getRecordingState(): boolean {
    return this.isRecording;
  }

  /**
   * 销毁音频管理器
   */
  destroy(): void {
    // 清理测试模式定时器
    if (this.testInterval) {
      clearInterval(this.testInterval);
      this.testInterval = null;
    }

    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.mediaRecorder = null;
    this.isTestMode = false;
    this.analyser = null;
    this.isRecording = false;
    
    console.log('音频管理器已销毁');
  }
}
