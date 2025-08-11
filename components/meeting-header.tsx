"use client"

import { ArrowLeft, Settings, Download, Share2, Users, Mic, MicOff } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface MeetingHeaderProps {
  isRecording: boolean
  participantCount: number
  meetingDuration: string
  onToggleRecording: () => void
  onExport: () => void
  onShare: () => void
  onSettings: () => void
}

export const MeetingHeader: React.FC<MeetingHeaderProps> = ({
  isRecording,
  participantCount,
  meetingDuration,
  onToggleRecording,
  onExport,
  onShare,
  onSettings,
}) => {
  return (
    <header className="relative w-full bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl border-b border-white/10 shadow-2xl">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-blue-500/5 to-indigo-500/5"></div>
      
      <div className="relative z-10 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Left section */}
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回主页
              </Button>
            </Link>
            
            <div className="h-6 w-px bg-white/20"></div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full animate-pulse"></div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  AI Minutes Live
                </h1>
              </div>
              
              {/* Meeting status indicators */}
              <div className="hidden sm:flex items-center gap-4 ml-6">
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-black/20 border border-white/10">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-white font-medium">{participantCount} 参与者</span>
                </div>
                
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-black/20 border border-white/10">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-white font-medium">{meetingDuration}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-3">
            {/* Recording status */}
            <div className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-300",
              isRecording 
                ? "bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 text-red-300 shadow-red-500/25 shadow-lg" 
                : "bg-gradient-to-r from-gray-500/20 to-gray-600/20 border border-gray-500/30 text-gray-300"
            )}>
              {isRecording ? (
                <>
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                  <span>录制中</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span>已停止</span>
                </>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <Button 
                onClick={onToggleRecording}
                size="sm"
                className={cn(
                  "transition-all duration-300 font-semibold",
                  isRecording 
                    ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-red-500/25 shadow-lg" 
                    : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-emerald-500/25 shadow-lg"
                )}
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-4 h-4 mr-2" />
                    停止
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    录制
                  </>
                )}
              </Button>

              <div className="hidden sm:flex items-center gap-2">
                <Button 
                  onClick={onShare}
                  variant="ghost" 
                  size="sm" 
                  className="text-white hover:bg-white/10 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                </Button>

                <Button 
                  onClick={onExport}
                  variant="ghost" 
                  size="sm" 
                  className="text-white hover:bg-white/10 transition-colors"
                >
                  <Download className="w-4 h-4" />
                </Button>

                <Button 
                  onClick={onSettings}
                  variant="ghost" 
                  size="sm" 
                  className="text-white hover:bg-white/10 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile meeting info */}
        <div className="sm:hidden flex items-center justify-center gap-4 mt-3 pt-3 border-t border-white/10">
          <div className="flex items-center gap-2 text-sm text-white">
            <Users className="w-4 h-4 text-blue-400" />
            {participantCount} 参与者
          </div>
          <div className="flex items-center gap-2 text-sm text-white">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            {meetingDuration}
          </div>
        </div>
      </div>
    </header>
  )
}
