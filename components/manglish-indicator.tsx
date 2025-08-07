import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface ManglishIndicatorProps {
  text: string;
}

// Placeholder function for Manglish detection
// In a real application, this would involve NLP models
const detectManglishLevel = (text: string): number => {
  const manglishKeywords = ["lah", "meh", "lor", "wan", "mah", "eh"]
  let score = 0
  for (const keyword of manglishKeywords) {
    if (text.toLowerCase().includes(keyword)) {
      score += 0.2
    }
  }
  return Math.min(score, 1) // Cap at 1
}

export const ManglishIndicator: React.FC<ManglishIndicatorProps> = ({ text }) => {
  const manglishScore = detectManglishLevel(text)

  if (manglishScore < 0.3) return null // Only show if score is significant

  return (
    <Badge
      variant="secondary"
      className={cn(
        "manglish-indicator bg-gradient-to-r from-malay-color to-english-color px-2 py-0.5 text-xs font-semibold text-white",
        "opacity-0 animate-in fade-in duration-500", // Simple animation
      )}
    >
      🇲🇾 Manglish {Math.round(manglishScore * 100)}%
    </Badge>
  )
}
