"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts'
import { Participant } from "@/types"
import { cn } from "@/lib/utils"
import { LanguagesIcon, UsersIcon, TrendingUpIcon } from 'lucide-react'

interface LanguageStats {
  breakdown: { name: string; value: number; fill: string }[];
  codeSwitchingPatterns: { name: string; value: number }[];
}

interface LanguageStatsDashboardProps {
  languageStats: LanguageStats;
  participants: Participant[];
}

const COLORS = ["var(--chinese-color)", "var(--english-color)", "var(--malay-color)"]

const getLanguageDisplayName = (langCode: string) => {
  switch (langCode) {
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

export const LanguageStatsDashboard: React.FC<LanguageStatsDashboardProps> = ({
  languageStats,
  participants,
}) => {
  return (
    <div className="stats-dashboard grid h-full grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
      {/* 语言使用饼图 */}
      <Card className="col-span-1 border-none bg-bg-secondary text-text-primary shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl font-bold">
            <LanguagesIcon className="h-6 w-6 text-english-color" />
            语言使用分布
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={languageStats.breakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
              >
                {languageStats.breakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: "var(--bg-tertiary)", border: "none" }}
                itemStyle={{ color: "var(--text-primary)" }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 参会者语言偏好 */}
      <Card className="col-span-1 border-none bg-bg-secondary text-text-primary shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl font-bold">
            <UsersIcon className="h-6 w-6 text-malay-color" />
            参会者语言偏好
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {participants.map((p) => (
            <div key={p.id} className="flex items-center justify-between text-sm">
              <span className="font-medium">{p.name}</span>
              <div className="flex gap-2">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-semibold text-white",
                    p.languageProfile.primaryLanguage === "zh" && "bg-chinese-color",
                    p.languageProfile.primaryLanguage === "en" && "bg-english-color",
                    p.languageProfile.primaryLanguage === "ms" && "bg-malay-color",
                  )}
                >
                  {getLanguageDisplayName(p.languageProfile.primaryLanguage)}
                </span>
                {Object.entries(p.languageProfile.proficiencyLevels).map(
                  ([lang, level]) =>
                    level > 0.5 &&
                    lang !== p.languageProfile.primaryLanguage && (
                      <span
                        key={lang}
                        className="rounded-full border border-text-secondary px-2 py-0.5 text-xs text-text-secondary"
                      >
                        {getLanguageDisplayName(lang)}
                      </span>
                    ),
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 代码切换统计 */}
      <Card className="col-span-1 border-none bg-bg-secondary text-text-primary shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl font-bold">
            <TrendingUpIcon className="h-6 w-6 text-chinese-color" />
            语言切换模式
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={languageStats.codeSwitchingPatterns}>
              <XAxis dataKey="name" stroke="var(--text-secondary)" />
              <YAxis stroke="var(--text-secondary)" />
              <Tooltip
                contentStyle={{ backgroundColor: "var(--bg-tertiary)", border: "none" }}
                itemStyle={{ color: "var(--text-primary)" }}
              />
              <Legend />
              <Bar dataKey="value" fill="var(--english-color)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
