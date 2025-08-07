import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LanguagesIcon } from 'lucide-react'
import { cn } from "@/lib/utils"

interface TranslationPanelProps {
  originalText: string;
  translations: { [lang: string]: string };
  culturalNotes: string[];
  onLanguageSelect: (lang: string) => void;
  selectedTranslationLang: string;
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

export const TranslationPanel: React.FC<TranslationPanelProps> = ({
  originalText,
  translations,
  culturalNotes,
  onLanguageSelect,
  selectedTranslationLang,
}) => {
  const availableLanguages = Object.keys(translations)

  return (
    <Card className="h-full w-full border-none bg-bg-secondary text-text-primary shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xl font-bold">
          <LanguagesIcon className="h-6 w-6 text-english-color" />
          智能翻译与洞察
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-text-secondary">
        <div>
          <h4 className="mb-2 text-base font-semibold text-text-primary">原文:</h4>
          <p className="rounded-md bg-bg-tertiary p-3 text-sm italic">{originalText}</p>
        </div>

        <div>
          <h4 className="mb-2 text-base font-semibold text-text-primary">选择翻译语言:</h4>
          <Select onValueChange={onLanguageSelect} value={selectedTranslationLang}>
            <SelectTrigger className="w-full bg-bg-tertiary text-text-primary">
              <SelectValue placeholder="选择语言" />
            </SelectTrigger>
            <SelectContent className="bg-bg-secondary text-text-primary">
              {availableLanguages.map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {getLanguageName(lang)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedTranslationLang && translations[selectedTranslationLang] && (
          <div>
            <h4 className="mb-2 text-base font-semibold text-text-primary">
              翻译 ({getLanguageName(selectedTranslationLang)}):
            </h4>
            <p className="rounded-md bg-bg-tertiary p-3 text-sm">
              {translations[selectedTranslationLang]}
            </p>
          </div>
        )}

        {culturalNotes && culturalNotes.length > 0 && (
          <div>
            <h4 className="mb-2 text-base font-semibold text-text-primary">文化注释:</h4>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {culturalNotes.map((note, index) => (
                <li key={index} className="rounded-md bg-bg-tertiary p-2">
                  {note}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Placeholder for other features like translation confidence, terminology */}
        <div className="mt-4 text-xs italic">
          <p>翻译置信度: 92%</p>
          <p>专业术语解释: "Makan" (马来语) - 意为“吃”</p>
        </div>
      </CardContent>
    </Card>
  )
}
