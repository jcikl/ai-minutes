/**
 * 音频录制钩子
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AudioManager, AudioMetrics } from '@/lib/audio-manager';

export interface UseAudioRecorderReturn {
  isRecording: boolean;
  audioData: number[];
  audioMetrics: AudioMetrics;
  isInitialized: boolean;
  error: string | null;
  startRecording: () => void;
  stopRecording: () => Promise<Blob | null>;
  toggleRecording: () => void;
  initialize: () => Promise<void>;
  destroy: () => void;
}

export const useAudioRecorder = (): UseAudioRecorderReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioData, setAudioData] = useState<number[]>(Array(20).fill(0));
  const [audioMetrics, setAudioMetrics] = useState<AudioMetrics>({
    volume: 0,
    frequency: [],
    pitch: 0,
    quality: 0,
    backgroundNoise: 0,
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioManagerRef = useRef<AudioManager | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  /**
   * 初始化音频管理器
   */
  const initialize = useCallback(async () => {
    try {
      setError(null);
      
      if (audioManagerRef.current) {
        audioManagerRef.current.destroy();
      }

      audioManagerRef.current = new AudioManager();
      await audioManagerRef.current.initialize();
      setIsInitialized(true);
      
      // 开始实时数据更新
      startDataUpdate();
      
      console.log('音频录制器初始化成功');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '音频录制器初始化失败';
      setError(errorMessage);
      setIsInitialized(false);
      console.error('音频录制器初始化失败:', err);
    }
  }, []);

  /**
   * 开始实时数据更新
   */
  const startDataUpdate = useCallback(() => {
    const updateData = () => {
      if (audioManagerRef.current) {
        // 获取音频可视化数据
        const newAudioData = audioManagerRef.current.getAudioData();
        setAudioData(newAudioData);

        // 获取音频指标
        const metrics = audioManagerRef.current.getAudioMetrics();
        setAudioMetrics(metrics);

        // 更新录制状态
        const recordingState = audioManagerRef.current.getRecordingState();
        setIsRecording(recordingState);
      }

      animationFrameRef.current = requestAnimationFrame(updateData);
    };

    updateData();
  }, []);

  /**
   * 开始录制
   */
  const startRecording = useCallback(() => {
    if (!audioManagerRef.current || !isInitialized) {
      console.warn('音频管理器未初始化');
      return;
    }

    try {
      audioManagerRef.current.startRecording();
      setIsRecording(true);
      setError(null);
      console.log('开始录制');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '开始录制失败';
      setError(errorMessage);
      console.error('开始录制失败:', err);
    }
  }, [isInitialized]);

  /**
   * 停止录制
   */
  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    if (!audioManagerRef.current || !isRecording) {
      return null;
    }

    try {
      const blob = await audioManagerRef.current.stopRecording();
      setIsRecording(false);
      setError(null);
      console.log('停止录制');
      return blob;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '停止录制失败';
      setError(errorMessage);
      console.error('停止录制失败:', err);
      return null;
    }
  }, [isRecording]);

  /**
   * 切换录制状态
   */
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  /**
   * 销毁音频录制器
   */
  const destroy = useCallback(() => {
    // 停止动画帧
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // 销毁音频管理器
    if (audioManagerRef.current) {
      audioManagerRef.current.destroy();
      audioManagerRef.current = null;
    }

    setIsInitialized(false);
    setIsRecording(false);
    setAudioData(Array(20).fill(0));
    setAudioMetrics({
      volume: 0,
      frequency: [],
      pitch: 0,
      quality: 0,
      backgroundNoise: 0,
    });
    setError(null);

    console.log('音频录制器已销毁');
  }, []);

  /**
   * 页面卸载时清理资源
   */
  useEffect(() => {
    return () => {
      destroy();
    };
  }, [destroy]);

  /**
   * 自动初始化（可选）
   */
  useEffect(() => {
    // 注释掉自动初始化，让用户手动初始化
    // initialize();
  }, []);

  return {
    isRecording,
    audioData,
    audioMetrics,
    isInitialized,
    error,
    startRecording,
    stopRecording,
    toggleRecording,
    initialize,
    destroy,
  };
};
