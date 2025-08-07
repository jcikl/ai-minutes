"use client"

import React, { useState, useEffect } from "react"
import { XIcon } from 'lucide-react'
import { Button } from "@/components/ui/button"

interface CulturalEvent {
  name: string;
  emoji: string;
  greeting: string;
  startDate: string;
  endDate: string;
}

const culturalEvents: CulturalEvent[] = [
  {
    name: "开斋节",
    emoji: "🌙",
    greeting: "Selamat Hari Raya Aidilfitri!",
    startDate: "2025-03-31", // Example date
    endDate: "2025-04-15",
  },
  {
    name: "农历新年",
    emoji: "🧧",
    greeting: "恭喜发财！",
    startDate: "2025-01-29", // Example date
    endDate: "2025-02-12",
  },
  {
    name: "屠妖节",
    emoji: "🪔",
    greeting: "Happy Deepavali!",
    startDate: "2025-10-20", // Example date
    endDate: "2025-10-26",
  },
  {
    name: "马来西亚日",
    emoji: "🇲🇾",
    greeting: "Selamat Hari Malaysia!",
    startDate: "2025-09-16",
    endDate: "2025-09-16",
  },
]

const detectCurrentCulturalEvent = (): CulturalEvent | null => {
  const now = new Date()
  const currentYear = now.getFullYear()

  for (const event of culturalEvents) {
    const start = new Date(`${currentYear}-${event.startDate.substring(5)}`)
    const end = new Date(`${currentYear}-${event.endDate.substring(5)}`)

    // Handle events spanning across year end (e.g., Dec to Jan)
    if (start.getMonth() > end.getMonth()) {
      end.setFullYear(currentYear + 1)
    }

    if (now >= start && now <= end) {
      return event
    }
  }
  return null
}

export const CulturalEventBanner: React.FC = () => {
  const [currentEvent, setCurrentEvent] = useState<CulturalEvent | null>(null)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    setCurrentEvent(detectCurrentCulturalEvent())
  }, [])

  if (!currentEvent || !isVisible) return null

  return (
    <div className="cultural-event-banner relative flex items-center justify-center gap-4 rounded-lg bg-gradient-to-r from-malay-color to-chinese-color p-3 text-white shadow-md">
      <div className="event-icon text-3xl">{currentEvent.emoji}</div>
      <div className="event-info text-center">
        <h4 className="text-lg font-bold">{currentEvent.name}</h4>
        <p className="text-sm">{currentEvent.greeting}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 text-white hover:bg-white/20"
        onClick={() => setIsVisible(false)}
        aria-label="Close banner"
      >
        <XIcon className="h-4 w-4" />
      </Button>
    </div>
  )
}
