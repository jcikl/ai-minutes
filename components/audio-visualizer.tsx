import React from "react"
import { cn } from "@/lib/utils"

interface AudioVisualizerProps {
  audioData: number[]; // Array of numbers representing audio amplitude (0-1)
  isRecording: boolean;
  detectedLanguage: string;
  volume: number; // 0-1 range
  audioQuality?: number; // 0-1 range
  backgroundNoise?: number; // 0-1 range
}

const getLanguageName = (code: string) => {
  switch (code) {
    case "zh":
      return "中文"
    case "en":
      return "English"
    case "ms":
      return "Bahasa Melayu"
    default:
      return "未知"
  }
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  audioData,
  isRecording,
  detectedLanguage,
  volume,
  audioQuality = 1,
  backgroundNoise = 0,
}) => {
  // 实时音频可视化
  const waveformBars = Array.from({ length: 20 }).map((_, i) => {
    const amplitude = audioData[i] || 0;
    const height = Math.max(2, amplitude * 100); // 确保最小高度为2%
    
    // 根据音质和噪音水平调整颜色
    const getBarColor = () => {
      if (!isRecording) return "bg-gray-400";
      
      if (audioQuality > 0.8 && backgroundNoise < 0.2) {
        return "bg-success-color"; // 高质量音频
      } else if (audioQuality > 0.5) {
        return "bg-english-color"; // 中等质量
      } else {
        return "bg-recording-color"; // 低质量或高噪音
      }
    };
    
    return (
      <div
        key={i}
        className={cn(
          "w-1.5 h-full rounded-full transition-all duration-150 ease-out hover-scale",
          getBarColor(),
          isRecording && amplitude > 0.5 && "wave-animation"
        )}
        style={{ 
          height: `${height}%`,
          opacity: isRecording ? Math.max(0.4, amplitude + 0.3) : 0.3,
          animationDelay: `${i * 0.1}s`
        }}
      />
    )
  })

  return (
    <div className="audio-visualizer relative flex h-20 w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-bg-secondary to-bg-tertiary p-3 card-shadow-lg">
      {/* Background glow effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-chinese-color/5 via-english-color/5 to-malay-color/5"></div>
      
      <div className="waveform-canvas relative flex h-full w-full items-end justify-between gap-1 z-10">
        {waveformBars}
      </div>

      {/* Enhanced language indicator */}
      <div
        className={cn(
          "language-indicator absolute bottom-3 right-3 rounded-full px-4 py-2 text-xs font-semibold text-white shadow-lg language-badge",
          isRecording && "float-animation",
          {
            "bg-chinese-color": detectedLanguage === "zh",
            "bg-english-color": detectedLanguage === "en", 
            "bg-malay-color": detectedLanguage === "ms",
            "bg-gradient-to-r from-chinese-color via-english-color to-malay-color":
              detectedLanguage === "mixed",
          },
        )}
      >
        <div className="flex items-center gap-1">
          {isRecording && (
            <div className="w-2 h-2 rounded-full bg-white status-online"></div>
          )}
          {getLanguageName(detectedLanguage)}
        </div>
      </div>

      {/* Enhanced volume meter */}
      <div className="volume-meter absolute left-3 top-3 h-3 w-24 rounded-full bg-bg-primary/50 backdrop-blur-sm border border-white/10">
        <div
          className={cn(
            "volume-bar h-full rounded-full transition-all duration-200 shadow-sm",
            {
              "bg-gradient-to-r from-success-color to-success-color/80": volume < 0.8,
              "bg-gradient-to-r from-processing-color to-processing-color/80": volume >= 0.8 && volume < 0.95,
              "bg-gradient-to-r from-recording-color to-recording-color/80": volume >= 0.95,
            }
          )}
          style={{ width: `${Math.min(100, volume * 100)}%` }}
        />
        <div className="absolute -top-1 -right-1 text-xs text-text-secondary font-medium">
          {Math.round(volume * 100)}%
        </div>
      </div>

      {/* Enhanced audio quality indicators */}
      {isRecording && (
        <div className="audio-quality absolute left-3 bottom-3 flex gap-2">
          <div 
            className={cn("flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm", {
              "bg-success-color/20 text-success-color": audioQuality > 0.8,
              "bg-processing-color/20 text-processing-color": audioQuality > 0.5 && audioQuality <= 0.8,
              "bg-recording-color/20 text-recording-color": audioQuality <= 0.5,
            })}
            title={`音频质量: ${Math.round(audioQuality * 100)}%`}
          >
            <div className={cn("w-2 h-2 rounded-full", {
              "bg-success-color": audioQuality > 0.8,
              "bg-processing-color": audioQuality > 0.5 && audioQuality <= 0.8,
              "bg-recording-color": audioQuality <= 0.5,
            })} />
            <span>质量</span>
          </div>
          <div 
            className={cn("flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm", {
              "bg-success-color/20 text-success-color": backgroundNoise < 0.2,
              "bg-processing-color/20 text-processing-color": backgroundNoise >= 0.2 && backgroundNoise < 0.5,
              "bg-recording-color/20 text-recording-color": backgroundNoise >= 0.5,
            })}
            title={`背景噪音: ${Math.round(backgroundNoise * 100)}%`}
          >
            <div className={cn("w-2 h-2 rounded-full", {
              "bg-success-color": backgroundNoise < 0.2,
              "bg-processing-color": backgroundNoise >= 0.2 && backgroundNoise < 0.5,
              "bg-recording-color": backgroundNoise >= 0.5,
            })} />
            <span>噪音</span>
          </div>
        </div>
      )}
    </div>
  )
}
