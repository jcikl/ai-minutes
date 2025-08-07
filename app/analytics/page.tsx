"use client"

import { useState, useEffect } from "react"
import { LanguageStatsDashboard } from "@/components/language-stats-dashboard"
import { Participant } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, PieChart } from 'lucide-react'

export default function AnalyticsPage() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [languageStats, setLanguageStats] = useState({
    breakdown: [],
    codeSwitchingPatterns: [],
  })

  // Simulate fetching participants and language stats
  useEffect(() => {
    setParticipants([
      {
        id: "speaker1",
        name: "John Doe",
        position: "CEO",
        avatar: "/placeholder.svg?height=48&width=48",
        languageProfile: {
          primaryLanguage: "en",
          proficiencyLevels: { en: 1, zh: 0.6, ms: 0.4 },
          culturalBackground: "Western",
          communicationStyle: "direct",
        },
      },
      {
        id: "speaker2",
        name: "Jane Smith",
        position: "Marketing Director",
        avatar: "/placeholder.svg?height=48&width=48",
        languageProfile: {
          primaryLanguage: "ms",
          proficiencyLevels: { ms: 1, en: 0.8, zh: 0.5 },
          culturalBackground: "Malay",
          communicationStyle: "mixed",
        },
      },
      {
        id: "speaker3",
        name: "Lim Wei",
        position: "Sales Manager",
        avatar: "/placeholder.svg?height=48&width=48",
        languageProfile: {
          primaryLanguage: "zh",
          proficiencyLevels: { zh: 1, en: 0.7, ms: 0.3 },
          culturalBackground: "Chinese-Malaysian",
          communicationStyle: "mixed",
        },
      },
    ])

    setLanguageStats({
      breakdown: [
        { name: "中文", value: 30, fill: "var(--chinese-color)" },
        { name: "English", value: 50, fill: "var(--english-color)" },
        { name: "Bahasa Melayu", value: 20, fill: "var(--malay-color)" },
      ],
      codeSwitchingPatterns: [
        { name: "EN-MS", value: 15 },
        { name: "MS-ZH", value: 8 },
        { name: "ZH-EN", value: 12 },
      ],
    })
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-bg-primary p-4 text-text-primary md:p-6">
      <h1 className="mb-6 text-3xl font-bold">会议分析报告</h1>

      <LanguageStatsDashboard languageStats={languageStats} participants={participants} />

      {/* Placeholder for other analytics sections */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-none bg-bg-secondary text-text-primary shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <PieChart className="h-6 w-6 text-processing-color" />
              参与度评估
            </CardTitle>
          </CardHeader>
          <CardContent className="text-text-secondary">
            <p>这里可以展示参会者的发言时间、活跃度等。</p>
          </CardContent>
        </Card>

        <Card className="border-none bg-bg-secondary text-text-primary shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <BarChart className="h-6 w-6 text-success-color" />
              关键洞察与建议
            </CardTitle>
          </CardHeader>
          <CardContent className="text-text-secondary">
            <p>根据会议内容提取的关键信息和改进建议。</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
