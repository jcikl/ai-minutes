import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Participant } from "@/types"
import { cn } from "@/lib/utils"
import { EditIcon } from 'lucide-react'
import { Button } from "@/components/ui/button"

interface ParticipantManagerProps {
  participants: Participant[];
  currentSpeakerId: string;
  onSpeakerChange?: (speakerId: string) => void;
  onParticipantEdit?: (participant: Participant) => void;
}

const getLanguageDisplayName = (langCode: string) => {
  switch (langCode) {
    case "zh":
      return "中文"
    case "en":
      return "English"
    case "ms":
      return "Bahasa Melayu"
    default:
      return "Unknown"
  }
}

export const ParticipantManager: React.FC<ParticipantManagerProps> = ({
  participants,
  currentSpeakerId,
  onSpeakerChange,
  onParticipantEdit,
}) => {
  return (
    <Card className="h-full w-full border-none bg-bg-secondary text-text-primary shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold">参会人员</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {participants.map((participant) => (
          <div
            key={participant.id}
            className={cn(
              "flex items-center gap-3 rounded-lg p-2 transition-all duration-200",
              currentSpeakerId === participant.id
                ? "bg-bg-tertiary ring-2 ring-english-color"
                : "hover:bg-bg-tertiary",
            )}
            onClick={() => onSpeakerChange?.(participant.id)}
          >
            <Avatar className="h-12 w-12 border-2 border-malay-color">
              <AvatarImage src={participant.avatar || "/placeholder.svg?height=48&width=48&query=person%20avatar"} />
              <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-base font-semibold">{participant.name}</h3>
              <p className="text-sm text-text-secondary">{participant.position}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                <Badge
                  className={cn(
                    "px-2 py-0.5 text-xs font-semibold text-white",
                    participant.languageProfile.primaryLanguage === "zh" && "bg-chinese-color",
                    participant.languageProfile.primaryLanguage === "en" && "bg-english-color",
                    participant.languageProfile.primaryLanguage === "ms" && "bg-malay-color",
                  )}
                >
                  {getLanguageDisplayName(participant.languageProfile.primaryLanguage)}
                </Badge>
                {Object.entries(participant.languageProfile.proficiencyLevels).map(
                  ([lang, level]) =>
                    level > 0.7 &&
                    lang !== participant.languageProfile.primaryLanguage && (
                      <Badge
                        key={lang}
                        variant="outline"
                        className="border-text-secondary text-text-secondary"
                      >
                        {getLanguageDisplayName(lang)}
                      </Badge>
                    ),
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                onParticipantEdit?.(participant)
              }}
              aria-label={`Edit ${participant.name}`}
            >
              <EditIcon className="h-4 w-4 text-text-secondary" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
