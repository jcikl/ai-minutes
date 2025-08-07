"use client"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DownloadIcon, MicIcon, MonitorStopIcon as StopIcon, LanguagesIcon as TranslateIcon } from 'lucide-react'
import { SupportedLanguage } from "@/types"
import { cn } from "@/lib/utils"

interface SmartControlBarProps {
  isRecording: boolean;
  currentLanguage: 'zh' | 'en' | 'ms';
  onToggleRecording: () => void;
  onLanguageChange: (lang: 'zh' | 'en' | 'ms') => void;
  onToggleTranslation: () => void;
  onExport: () => void;
}

const supportedLanguages: SupportedLanguage[] = [
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "ms", name: "Bahasa Melayu", flag: "🇲🇾" },
]

export const SmartControlBar: React.FC<SmartControlBarProps> = ({
  isRecording,
  currentLanguage,
  onToggleRecording,
  onLanguageChange,
  onToggleTranslation,
  onExport,
}) => {
  return (
    <div className="smart-control-bar gradient-border">
      <div className="gradient-border-content flex w-full items-center justify-between">
        {/* 录音控制 */}
        <div className="recording-controls">
          <Button
            variant={isRecording ? "destructive" : "default"}
            onClick={onToggleRecording}
            className={cn(
              "record-button px-8 py-4 text-lg font-bold rounded-xl shadow-lg hover-scale transition-all duration-300",
              {
                "recording-pulse bg-gradient-to-r from-recording-color to-red-600 hover:from-red-600 hover:to-recording-color": isRecording,
                "bg-gradient-to-r from-success-color to-green-600 hover:from-green-600 hover:to-success-color text-white": !isRecording,
              }
            )}
          >
            <div className="flex items-center gap-3">
              {isRecording ? (
                <StopIcon className="h-6 w-6" />
              ) : (
                <MicIcon className="h-6 w-6" />
              )}
              <span className="text-shimmer">
                {isRecording ? "停止录音" : "开始录音"}
              </span>
            </div>
          </Button>
        </div>

        {/* Enhanced language quick switch */}
        <div className="language-quick-switch flex gap-3">
          {supportedLanguages.map((lang) => (
            <Button
              key={lang.code}
              variant={currentLanguage === lang.code ? "default" : "ghost"}
              onClick={() => onLanguageChange(lang.code)}
              className={cn(
                "lang-btn px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-300 hover-scale language-badge",
                {
                  "bg-gradient-to-r from-chinese-color to-red-400 text-white shadow-lg":
                    currentLanguage === "zh" && lang.code === "zh",
                  "bg-gradient-to-r from-english-color to-blue-400 text-white shadow-lg":
                    currentLanguage === "en" && lang.code === "en",
                  "bg-gradient-to-r from-malay-color to-teal-400 text-white shadow-lg":
                    currentLanguage === "ms" && lang.code === "ms",
                  "text-text-secondary hover:bg-bg-tertiary/50 border border-bg-tertiary": currentLanguage !== lang.code,
                },
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{lang.flag}</span>
                <span>{lang.name}</span>
                {currentLanguage === lang.code && (
                  <div className="w-2 h-2 rounded-full bg-white status-online"></div>
                )}
              </div>
            </Button>
          ))}
        </div>

        {/* Enhanced quick actions */}
        <div className="quick-actions flex gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="lg" 
                  onClick={onToggleTranslation} 
                  aria-label="Toggle translation display"
                  className="rounded-xl hover-scale bg-bg-tertiary/50 hover:bg-processing-color/20 transition-all duration-300"
                >
                  <TranslateIcon className="h-6 w-6 text-processing-color" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-bg-secondary border-bg-tertiary text-text-primary">
                <p>切换翻译显示</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="lg" 
                  onClick={onExport} 
                  aria-label="Export meeting record"
                  className="rounded-xl hover-scale bg-bg-tertiary/50 hover:bg-english-color/20 transition-all duration-300"
                >
                  <DownloadIcon className="h-6 w-6 text-english-color" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-bg-secondary border-bg-tertiary text-text-primary">
                <p>导出会议记录</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  )
}
