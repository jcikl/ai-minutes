import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { EditIcon, GavelIcon, GlobeIcon, MicIcon, ShareIcon, LanguagesIcon as TranslateIcon, LoaderIcon } from 'lucide-react'
import { TranscriptSegment } from "@/types"
import { LanguageBadge } from "./language-badge"
import { cn } from "@/lib/utils"
import { ManglishIndicator } from "@/components/manglish-indicator"
import { useTranslation } from "@/hooks/useTranslation"
import { useState, useCallback } from "react"

interface TranscriptCardProps {
  segment: TranscriptSegment;
  showTranslation: boolean;
  onTranslate?: (segmentId: string) => void;
  onEdit?: (segmentId: string) => void;
  targetLanguage?: 'zh' | 'en' | 'ms';
}

const formatTime = (date: Date) => {
  const minutes = date.getMinutes().toString().padStart(2, "0")
  const seconds = date.getSeconds().toString().padStart(2, "0")
  return `${minutes}:${seconds}`
}

const renderMultiLanguageText = (
  content: string,
  languageData: TranscriptSegment["languageData"],
) => {
  // This is a simplified representation.
  // A real implementation would involve more complex text segmentation and styling.
  const primaryColorClass = cn({
    "text-chinese-color": languageData.primaryLanguage === "zh",
    "text-english-color": languageData.primaryLanguage === "en",
    "text-malay-color": languageData.primaryLanguage === "ms",
  })

  const isMixed = languageData.detectedLanguages.length > 1

  return (
    <p
      className={cn(
        "text-lg font-medium",
        primaryColorClass,
        isMixed && "multilingual-text", // Apply gradient for mixed languages
      )}
    >
      {content}
    </p>
  )
}

const ConfidenceIndicator: React.FC<{ value: number }> = ({ value }) => {
  const color =
    value > 0.9 ? "bg-success-color" : value > 0.7 ? "bg-processing-color" : "bg-recording-color"
  return (
    <div className="flex items-center gap-1 text-xs text-text-secondary">
      <span className="font-semibold">置信度:</span>
      <div className="h-2 w-16 rounded-full bg-bg-tertiary">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${value * 100}%` }} />
      </div>
      <span>{Math.round(value * 100)}%</span>
    </div>
  )
}

const ActionButtons: React.FC<{ onEdit?: () => void; onTranslate?: () => void }> = ({
  onEdit,
  onTranslate,
}) => (
  <div className="flex gap-2">
    <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Edit transcript">
      <EditIcon className="h-4 w-4 text-text-secondary" />
    </Button>
    <Button variant="ghost" size="icon" onClick={onTranslate} aria-label="Translate transcript">
      <GlobeIcon className="h-4 w-4 text-text-secondary" />
    </Button>
  </div>
)

export const TranscriptCard: React.FC<TranscriptCardProps> = ({
  segment,
  showTranslation,
  onTranslate,
  onEdit,
  targetLanguage = 'en',
}) => {
  const { translateText, isTranslating } = useTranslation();
  const [realTimeTranslations, setRealTimeTranslations] = useState<Record<string, string>>({});
  const [translationErrors, setTranslationErrors] = useState<Record<string, string>>({});

  // 实时翻译功能
  const handleRealTimeTranslate = useCallback(async (toLang: 'zh' | 'en' | 'ms') => {
    if (realTimeTranslations[toLang] || isTranslating) return;

    try {
      setTranslationErrors(prev => ({ ...prev, [toLang]: '' }));
      
      const result = await translateText(
        segment.content,
        segment.languageData.primaryLanguage as 'zh' | 'en' | 'ms',
        toLang
      );

      setRealTimeTranslations(prev => ({
        ...prev,
        [toLang]: result.translatedText
      }));
    } catch (error) {
      setTranslationErrors(prev => ({
        ...prev,
        [toLang]: '翻译失败'
      }));
    }
  }, [segment.content, segment.languageData.primaryLanguage, translateText, isTranslating, realTimeTranslations]);

  return (
    <Card
      className={cn(
        "transcript-card w-full text-white shadow-2xl hover:shadow-3xl transition-all duration-500 relative overflow-hidden group hover:scale-[1.02] backdrop-blur-sm",
        {
          "bg-gradient-to-br from-red-900/20 via-slate-800/80 to-pink-900/20 border border-red-500/30": 
            segment.languageData.primaryLanguage === "zh",
          "bg-gradient-to-br from-blue-900/20 via-slate-800/80 to-indigo-900/20 border border-blue-500/30": 
            segment.languageData.primaryLanguage === "en",
          "bg-gradient-to-br from-emerald-900/20 via-slate-800/80 to-teal-900/20 border border-emerald-500/30": 
            segment.languageData.primaryLanguage === "ms",
        },
      )}
    >
      {/* Animated background glow effect */}
      <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500", {
        "bg-gradient-to-r from-transparent via-red-500/20 to-transparent animate-pulse": 
          segment.languageData.primaryLanguage === "zh",
        "bg-gradient-to-r from-transparent via-blue-500/20 to-transparent animate-pulse": 
          segment.languageData.primaryLanguage === "en",
        "bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent animate-pulse": 
          segment.languageData.primaryLanguage === "ms",
      })} />
      
      {/* Language accent bar */}
      <div className={cn("absolute top-0 left-0 h-1 w-full", {
        "bg-gradient-to-r from-red-400 to-pink-400": segment.languageData.primaryLanguage === "zh",
        "bg-gradient-to-r from-blue-400 to-indigo-400": segment.languageData.primaryLanguage === "en",
        "bg-gradient-to-r from-emerald-400 to-teal-400": segment.languageData.primaryLanguage === "ms",
      })} />
      
      <CardContent className="p-4">
        <div className="speaker-header mb-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className={cn("h-12 w-12 border-2 ring-2 ring-offset-2 ring-offset-slate-800 transition-all duration-300", {
                "border-red-400 ring-red-400/50": segment.languageData.primaryLanguage === "zh",
                "border-blue-400 ring-blue-400/50": segment.languageData.primaryLanguage === "en",
                "border-emerald-400 ring-emerald-400/50": segment.languageData.primaryLanguage === "ms",
              })}>
                <AvatarImage src={segment.speakerId === "speaker1" ? "/placeholder.svg?height=48&width=48&query=male%20avatar" : "/placeholder.svg?height=48&width=48&query=female%20avatar"} />
                <AvatarFallback className={cn("text-white font-bold", {
                  "bg-gradient-to-br from-red-500 to-pink-500": segment.languageData.primaryLanguage === "zh",
                  "bg-gradient-to-br from-blue-500 to-indigo-500": segment.languageData.primaryLanguage === "en",
                  "bg-gradient-to-br from-emerald-500 to-teal-500": segment.languageData.primaryLanguage === "ms",
                })}>
                  {segment.speakerId === "speaker1" ? "JD" : "JS"}
                </AvatarFallback>
              </Avatar>
              {/* Online status indicator */}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-slate-800 animate-pulse"></div>
            </div>
            <div className="speaker-info">
              <span className="speaker-name block text-lg font-bold text-white">
                {segment.speakerId === "speaker1" ? "John Doe" : "Jane Smith"}
              </span>
              <div className="flex items-center gap-2">
                <span className="timestamp text-sm text-gray-300 font-medium">
                  {formatTime(segment.timestamp)}
                </span>
                <span className={cn("px-2 py-1 rounded-full text-xs font-semibold", {
                  "bg-red-500/20 text-red-300": segment.languageData.primaryLanguage === "zh",
                  "bg-blue-500/20 text-blue-300": segment.languageData.primaryLanguage === "en",
                  "bg-emerald-500/20 text-emerald-300": segment.languageData.primaryLanguage === "ms",
                })}>
                  {segment.languageData.primaryLanguage === "zh" ? "CEO" : "营销总监"}
                </span>
              </div>
            </div>
          </div>
          <LanguageBadge languages={segment.languageData.detectedLanguages} />
        </div>

        <div className="original-text mb-4 p-4 rounded-xl bg-black/20 backdrop-blur-sm border border-white/10">
          {renderMultiLanguageText(segment.content, segment.languageData)}
        </div>
        
        {/* Enhanced ManglishIndicator */}
        <div className="mb-4">
          <ManglishIndicator text={segment.content} />
        </div>

        {/* Enhanced translation display */}
        {showTranslation && segment.languageData.translations && (
          <div className="translation-section space-y-3 rounded-xl bg-gradient-to-br from-black/30 to-black/20 backdrop-blur-sm border border-white/10 p-4 mb-4">
            <h4 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
              翻译结果
            </h4>
            {Object.entries(segment.languageData.translations).map(([lang, text]) => (
              <div key={lang} className="translation-item p-3 rounded-lg bg-white/5 border border-white/10">
                <span
                  className={cn(
                    "lang-label inline-block px-2 py-1 rounded-md text-xs font-bold mb-2",
                    {
                      "bg-red-500/20 text-red-300": lang === "zh",
                      "bg-blue-500/20 text-blue-300": lang === "en",
                      "bg-emerald-500/20 text-emerald-300": lang === "ms",
                    },
                  )}
                >
                  {lang === "zh" ? "中文" : lang === "en" ? "English" : "Bahasa Melayu"}
                </span>
                <p className="text-sm text-gray-200 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        )}

        {/* 实时翻译控制 */}
        {showTranslation && (
          <div className="real-time-translation mt-3 space-y-2">
            <div className="flex flex-wrap gap-2">
              {['zh', 'en', 'ms'].map((lang) => {
                const langCode = lang as 'zh' | 'en' | 'ms';
                const isSourceLang = segment.languageData.primaryLanguage === langCode;
                
                if (isSourceLang) return null;
                
                return (
                  <Button
                    key={lang}
                    variant="outline"
                    size="sm"
                    onClick={() => handleRealTimeTranslate(langCode)}
                    disabled={isTranslating}
                    className={cn(
                      "text-xs",
                      {
                        "border-chinese-color text-chinese-color": lang === 'zh',
                        "border-english-color text-english-color": lang === 'en',
                        "border-malay-color text-malay-color": lang === 'ms',
                      }
                    )}
                  >
                    {isTranslating ? (
                      <LoaderIcon className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <TranslateIcon className="h-3 w-3 mr-1" />
                    )}
                    翻译到{lang === 'zh' ? '中文' : lang === 'en' ? 'English' : 'Bahasa Melayu'}
                  </Button>
                );
              })}
            </div>

            {/* 实时翻译结果 */}
            {Object.entries(realTimeTranslations).map(([lang, translation]) => (
              <div key={`real-${lang}`} className="real-time-result rounded-md bg-bg-primary p-2 border-l-2 border-l-success-color">
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      {
                        "text-chinese-color": lang === "zh",
                        "text-english-color": lang === "en",
                        "text-malay-color": lang === "ms",
                      },
                    )}
                  >
                    实时翻译 ({lang.toUpperCase()}):
                  </span>
                  <span className="text-xs text-success-color">✓ 已完成</span>
                </div>
                <p className="text-sm text-text-primary">{translation}</p>
              </div>
            ))}

            {/* 翻译错误 */}
            {Object.entries(translationErrors).map(([lang, error]) => error && (
              <div key={`error-${lang}`} className="translation-error rounded-md bg-recording-color/10 p-2 border-l-2 border-l-recording-color">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-recording-color font-semibold">翻译错误:</span>
                  <span className="text-xs text-recording-color">{error}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="card-footer mt-3 flex items-center justify-between">
          <ConfidenceIndicator value={segment.languageData.confidence} />
          <ActionButtons
            onEdit={() => onEdit?.(segment.id)}
            onTranslate={() => onTranslate?.(segment.id)}
          />
        </div>
      </CardContent>
    </Card>
  )
}
