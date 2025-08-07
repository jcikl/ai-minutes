"use client"

import { useState, useEffect } from "react"
import { doc, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/config"
import { WifiIcon } from 'lucide-react'
import { TranscriptSegment } from "@/types"

interface RealtimeTranscriptSyncProps {
  meetingId: string;
  onTranscriptsUpdate: (transcripts: TranscriptSegment[]) => void;
}

export const RealtimeTranscriptSync: React.FC<RealtimeTranscriptSyncProps> = ({
  meetingId,
  onTranscriptsUpdate,
}) => {
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    if (!meetingId) return

    setIsSyncing(true)
    const unsubscribe = onSnapshot(
      doc(db, "meetings", meetingId),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data()
          onTranscriptsUpdate(data.transcripts || [])
        } else {
          onTranscriptsUpdate([]) // No meeting found or deleted
        }
        setIsSyncing(false)
      },
      (error) => {
        console.error("Error fetching real-time transcripts:", error)
        setIsSyncing(false)
      },
    )

    return () => unsubscribe()
  }, [meetingId, onTranscriptsUpdate])

  return (
    <div className="realtime-sync-indicator flex items-center gap-2 text-sm text-text-secondary">
      <WifiIcon className={`h-4 w-4 ${isSyncing ? "text-processing-color animate-pulse" : "text-success-color"}`} />
      <span>{isSyncing ? "实时同步中..." : "已同步"}</span>
    </div>
  )
}
