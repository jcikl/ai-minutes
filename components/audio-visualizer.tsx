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
    <div className="audio-visualizer relative flex h-32 w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/50 via-slate-700/50 to-slate-800/50 backdrop-blur-xl border border-white/10 p-6 shadow-2xl">
      {/* Animated background patterns */}
      <div className="absolute inset-0 rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-purple-500/10 animate-pulse"></div>
        {isRecording && (
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-blue-500/5 to-purple-500/5 animate-pulse"></div>
        )}
      </div>
      
      {/* Audio quality indicator ring */}
      <div className="absolute top-4 right-4 z-20">
        <div className={cn(
          "w-3 h-3 rounded-full transition-all duration-300",
          audioQuality > 0.8 ? "bg-emerald-400 shadow-emerald-400/50" : 
          audioQuality > 0.5 ? "bg-amber-400 shadow-amber-400/50" : 
          "bg-red-400 shadow-red-400/50",
          isRecording && "animate-pulse shadow-lg"
        )}></div>
      </div>
      
      <div className="waveform-canvas relative flex h-full w-full items-end justify-center gap-1 z-10 max-w-md">
        {waveformBars}
      </div>

      {/* Enhanced language indicator */}
      <div className="absolute bottom-4 left-4 z-20">
        <div
          className={cn(
            "language-indicator rounded-xl px-3 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur-sm border border-white/20 language-badge transition-all duration-300",
            isRecording && "scale-105",
            {
              "bg-gradient-to-r from-red-500/80 to-pink-500/80": detectedLanguage === "zh",
              "bg-gradient-to-r from-blue-500/80 to-indigo-500/80": detectedLanguage === "en", 
              "bg-gradient-to-r from-emerald-500/80 to-teal-500/80": detectedLanguage === "ms",
              "bg-gradient-to-r from-purple-500/80 via-pink-500/80 to-indigo-500/80":
                detectedLanguage === "mixed",
            },
          )}
        >
          <div className="flex items-center gap-2">
            {isRecording && (
              <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
            )}
            <span>{getLanguageName(detectedLanguage)}</span>
          </div>
        </div>
      </div>

      {/* Enhanced volume meter */}
      <div className="absolute top-4 left-4 z-20">
        <div className="bg-black/30 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-white/80 font-medium">音量</span>
            <span className="text-xs text-white font-bold">{Math.round(volume * 100)}%</span>
          </div>
          <div className="volume-meter h-2 w-20 rounded-full bg-white/20 overflow-hidden">
            <div
              className={cn(
                "volume-bar h-full rounded-full transition-all duration-200",
                {
                  "bg-gradient-to-r from-emerald-400 to-emerald-500": volume < 0.8,
                  "bg-gradient-to-r from-amber-400 to-amber-500": volume >= 0.8 && volume < 0.95,
                  "bg-gradient-to-r from-red-400 to-red-500": volume >= 0.95,
                }
              )}
              style={{ width: `${Math.min(100, volume * 100)}%` }}
            />
          </div>
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
