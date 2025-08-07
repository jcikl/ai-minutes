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
        "transcript-card w-full border-none text-text-primary card-shadow-lg hover-scale transition-all duration-300 relative overflow-hidden",
        {
          "bg-gradient-to-br from-bg-secondary via-bg-secondary to-chinese-color/5 border-l-4 border-chinese-color": 
            segment.languageData.primaryLanguage === "zh",
          "bg-gradient-to-br from-bg-secondary via-bg-secondary to-english-color/5 border-l-4 border-english-color": 
            segment.languageData.primaryLanguage === "en",
          "bg-gradient-to-br from-bg-secondary via-bg-secondary to-malay-color/5 border-l-4 border-malay-color": 
            segment.languageData.primaryLanguage === "ms",
        },
      )}
    >
      {/* Background glow effect */}
      <div className={cn("absolute inset-0 opacity-20", {
        "bg-gradient-to-r from-transparent via-chinese-color/10 to-transparent": 
          segment.languageData.primaryLanguage === "zh",
        "bg-gradient-to-r from-transparent via-english-color/10 to-transparent": 
          segment.languageData.primaryLanguage === "en",
        "bg-gradient-to-r from-transparent via-malay-color/10 to-transparent": 
          segment.languageData.primaryLanguage === "ms",
      })} />
      
      <CardContent className="p-4">
        <div className="speaker-header mb-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-english-color">
              <AvatarImage src={segment.speakerId === "speaker1" ? "/placeholder.svg?height=40&width=40&query=male%20avatar" : "/placeholder.svg?height=40&width=40&query=female%20avatar"} />
              <AvatarFallback>
                {segment.speakerId === "speaker1" ? "S1" : "S2"}
              </AvatarFallback>
            </Avatar>
            <div className="speaker-info">
              <span className="speaker-name block text-base font-semibold text-text-primary">
                {segment.speakerId === "speaker1" ? "John Doe" : "Jane Smith"}
              </span>
              <span className="timestamp text-xs text-text-secondary">
                {formatTime(segment.timestamp)}
              </span>
            </div>
          </div>
          <LanguageBadge languages={segment.languageData.detectedLanguages} />
        </div>

        <div className="original-text mb-3">
          {renderMultiLanguageText(segment.content, segment.languageData)}
        </div>
        <ManglishIndicator text={segment.content} /> {/* Add ManglishIndicator */}

        {/* 原有翻译显示 */}
        {showTranslation && segment.languageData.translations && (
          <div className="translation-section space-y-2 rounded-md bg-bg-tertiary p-3">
            {Object.entries(segment.languageData.translations).map(([lang, text]) => (
              <div key={lang} className={`translation-item text-sm text-text-secondary`}>
                <span
                  className={cn(
                    "lang-label mr-2 font-semibold",
                    {
                      "text-chinese-color": lang === "zh",
                      "text-english-color": lang === "en",
                      "text-malay-color": lang === "ms",
                    },
                  )}
                >
                  {lang.toUpperCase()}:
                </span>
                <p className="inline">{text}</p>
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
