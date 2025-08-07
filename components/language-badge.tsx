import { Badge } from "@/components/ui/badge"
import { LanguageDetection } from "@/types"
import { cn } from "@/lib/utils"

interface LanguageBadgeProps {
  languages: LanguageDetection[];
}

const getLanguageColorClass = (langCode: string) => {
  switch (langCode) {
    case "zh":
      return "bg-chinese-color"
    case "en":
      return "bg-english-color"
    case "ms":
      return "bg-malay-color"
    default:
      return "bg-gray-500"
  }
}

const getLanguageDisplayName = (langCode: string) => {
  switch (langCode) {
    case "zh":
      return "中文"
    case "en":
      return "EN"
    case "ms":
      return "BM"
    default:
      return "UNK"
  }
}

export const LanguageBadge: React.FC<LanguageBadgeProps> = ({ languages }) => {
  if (!languages || languages.length === 0) return null

  // Sort by confidence and take top 3 for display
  const sortedLanguages = [...languages].sort((a, b) => b.confidence - a.confidence).slice(0, 3)

  return (
    <div className="flex gap-1">
      {sortedLanguages.map((lang, index) => (
        <Badge
          key={index}
          className={cn(
            "px-2 py-0.5 text-xs font-semibold text-white",
            getLanguageColorClass(lang.language),
          )}
        >
          {getLanguageDisplayName(lang.language)}
        </Badge>
      ))}
    </div>
  )
}
