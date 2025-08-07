"use client"

import { useState, useEffect, useCallback } from "react"
import { useAudioRecorder } from "@/hooks/useAudioRecorder"
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition"
import { useLanguageDetection } from "@/hooks/useLanguageDetection"
import { RealtimeTranscriptSync } from "@/components/realtime-sync"
import { AuthWrapper } from "@/components/auth-wrapper"
import { AudioVisualizer } from "@/components/audio-visualizer"
import { TranscriptCard } from "@/components/transcript-card"
import { ParticipantManager } from "@/components/participant-manager"
import { SmartControlBar } from "@/components/smart-control-bar"
import { Participant, TranscriptSegment } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { WifiIcon } from 'lucide-react'
import { CulturalEventBanner } from "@/components/cultural-event-banner"
import { TranslationPanel } from "@/components/translation-panel"

export default function MeetingPage() {
  // 首先定义状态变量
  const [currentLanguage, setCurrentLanguage] = useState<'zh' | 'en' | 'ms'>("en");

  // 使用音频录制钩子
  const {
    isRecording,
    audioData,
    audioMetrics,
    isInitialized,
    error: audioError,
    startRecording,
    stopRecording,
    toggleRecording,
    initialize: initializeAudio,
    destroy: destroyAudio,
  } = useAudioRecorder();

  // 使用语音识别钩子
  const {
    isListening,
    isSupported: speechSupported,
    transcript: currentTranscript,
    interimTranscript,
    finalTranscript,
    confidence: speechConfidence,
    detectedLanguage: speechDetectedLanguage,
    error: speechError,
    start: startSpeech,
    stop: stopSpeech,
    setLanguage: setSpeechLanguage,
    reset: resetSpeech,
  } = useSpeechRecognition({
    continuous: true,
    interimResults: true,
    language: currentLanguage,
  });

  // 使用语言检测钩子
  const {
    detectLanguage,
    currentLanguage: detectedCurrentLanguage,
    confidence: langDetectionConfidence,
    languageBreakdown,
    codeSwitchingPoints,
    culturalMarkers,
    statistics: languageStats,
    error: languageError,
    clearHistory: clearLanguageHistory,
  } = useLanguageDetection({
    autoDetect: true,
    minConfidence: 0.3,
    debounceMs: 500,
  });

  // 其他状态变量
  const [showTranslations, setShowTranslations] = useState(false)
  const [transcripts, setTranscripts] = useState<TranscriptSegment[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [currentSpeakerId, setCurrentSpeakerId] = useState("speaker1")
  const [detectedLanguage, setDetectedLanguage] = useState("en")
  const [lastProcessedTranscript, setLastProcessedTranscript] = useState("")
  const [selectedTranslationSegmentId, setSelectedTranslationSegmentId] = useState<string | null>(null)
  const [selectedTranslationLang, setSelectedTranslationLang] = useState<string>("en")
  const [permissionGranted, setPermissionGranted] = useState(false)

  // 初始化音频系统
  useEffect(() => {
    const initAudio = async () => {
      try {
        await initializeAudio();
        setPermissionGranted(true);
      } catch (error) {
        console.error('音频初始化失败:', error);
        setPermissionGranted(false);
      }
    };

    initAudio();

    return () => {
      destroyAudio();
    };
  }, [initializeAudio, destroyAudio]);

  // 处理语音识别结果
  useEffect(() => {
    if (finalTranscript && finalTranscript !== lastProcessedTranscript) {
      // 使用语言检测器分析文本
      const langDetectionResult = detectLanguage(finalTranscript);
      
      const newSegment: TranscriptSegment = {
        id: `seg-${Date.now()}`,
        speakerId: currentSpeakerId,
        content: finalTranscript.trim(),
        timestamp: new Date(),
        languageData: {
          detectedLanguages: [
            { 
              language: langDetectionResult.detectedLanguage === 'mixed' 
                ? (speechDetectedLanguage || currentLanguage)
                : langDetectionResult.detectedLanguage, 
              confidence: Math.max(speechConfidence, langDetectionResult.confidence)
            },
          ],
          primaryLanguage: langDetectionResult.detectedLanguage === 'mixed' 
            ? (speechDetectedLanguage || currentLanguage)
            : langDetectionResult.detectedLanguage,
          confidence: Math.max(speechConfidence, langDetectionResult.confidence),
          translations: {
            zh: finalTranscript.trim(), // 实际项目中需要调用翻译API
            en: finalTranscript.trim(),
            ms: finalTranscript.trim(),
          },
          culturalNotes: culturalMarkers,
        },
        metadata: {
          audioQuality: audioMetrics.quality,
          backgroundNoise: audioMetrics.backgroundNoise,
          speakingSpeed: 1.0,
          emotionalTone: "neutral",
          languageBreakdown: languageBreakdown,
          codeSwitchingPoints: codeSwitchingPoints,
        },
      };

      setTranscripts((prev) => [...prev, newSegment]);
      setLastProcessedTranscript(finalTranscript);
    }
  }, [
    finalTranscript, 
    lastProcessedTranscript, 
    currentSpeakerId, 
    speechDetectedLanguage, 
    currentLanguage, 
    speechConfidence, 
    audioMetrics.quality, 
    audioMetrics.backgroundNoise,
    detectLanguage,
    culturalMarkers,
    languageBreakdown,
    codeSwitchingPoints
  ]);

  // 更新检测到的语言
  useEffect(() => {
    if (detectedCurrentLanguage && detectedCurrentLanguage !== 'mixed') {
      setDetectedLanguage(detectedCurrentLanguage);
    } else if (speechDetectedLanguage) {
      setDetectedLanguage(speechDetectedLanguage);
    }
  }, [detectedCurrentLanguage, speechDetectedLanguage]);

  // Initialize participants
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
    ])
  }, [])

  const handleToggleRecording = useCallback(() => {
    if (!isInitialized) {
      console.warn('音频系统未初始化');
      return;
    }
    
    if (isRecording) {
      // 停止录制和语音识别
      stopRecording();
      stopSpeech();
    } else {
      // 开始录制和语音识别
      startRecording();
      if (speechSupported) {
        startSpeech();
      }
    }
  }, [isInitialized, isRecording, startRecording, stopRecording, startSpeech, stopSpeech, speechSupported])

  const handleLanguageChange = useCallback((lang: 'zh' | 'en' | 'ms') => {
    setCurrentLanguage(lang);
    setSpeechLanguage(lang);
  }, [setSpeechLanguage])

  const handleToggleTranslation = useCallback(() => {
    setShowTranslations((prev) => !prev)
  }, [])

  const handleExport = useCallback(() => {
    alert("Export functionality not implemented yet!")
  }, [])

  const handleTranscriptsUpdate = useCallback((newTranscripts: TranscriptSegment[]) => {
    setTranscripts(newTranscripts)
  }, [])

  const handleTranslateSegment = useCallback((segmentId: string) => {
    setSelectedTranslationSegmentId(segmentId)
  }, [])

  return (
    // 临时移除 AuthWrapper 以便测试
    // <AuthWrapper>
      <div className="flex h-screen w-full flex-col bg-bg-primary p-4 text-text-primary md:p-6 lg:flex-row lg:gap-6">
        {/* Sidebar for Participants (Tablet & Desktop) */}
        <aside className="hidden w-full lg:block lg:w-1/4">
          <ParticipantManager
            participants={participants}
            currentSpeakerId={currentSpeakerId}
            onSpeakerChange={setCurrentSpeakerId}
          />
        </aside>

        {/* Main Content Area */}
        <main className="flex flex-1 flex-col gap-4 overflow-hidden">
          <CulturalEventBanner />
          {/* Header / Audio Visualizer */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold md:text-3xl">会议转录</h1>
              <RealtimeTranscriptSync
                meetingId="meeting-123"
                onTranscriptsUpdate={handleTranscriptsUpdate}
              />
            </div>
            <AudioVisualizer
              audioData={audioData}
              isRecording={isRecording}
              detectedLanguage={detectedLanguage}
              volume={audioMetrics.volume}
              audioQuality={audioMetrics.quality}
              backgroundNoise={audioMetrics.backgroundNoise}
            />
            
            {/* 音频错误提示 */}
            {audioError && (
              <div className="audio-error mt-2 rounded-lg bg-recording-color/10 p-3 text-recording-color">
                <p className="text-sm font-medium">音频错误: {audioError}</p>
                <button 
                  onClick={initializeAudio}
                  className="mt-1 text-xs underline hover:no-underline"
                >
                  重新初始化
                </button>
              </div>
            )}
            
            {/* 权限提示 */}
            {!permissionGranted && (
              <div className="permission-prompt mt-2 rounded-lg bg-processing-color/10 p-3 text-processing-color">
                <p className="text-sm font-medium">需要麦克风权限才能开始录制</p>
                <button 
                  onClick={initializeAudio}
                  className="mt-1 text-xs underline hover:no-underline"
                >
                  授权访问麦克风
                </button>
              </div>
            )}

            {/* 语音识别错误提示 */}
            {speechError && (
              <div className="speech-error mt-2 rounded-lg bg-recording-color/10 p-3 text-recording-color">
                <p className="text-sm font-medium">语音识别错误: {speechError}</p>
              </div>
            )}

            {/* 语音识别状态 */}
            {isRecording && (
              <div className="speech-status mt-2 rounded-lg bg-bg-tertiary p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">语音识别:</span>
                  <div className="flex items-center gap-2">
                    {speechSupported ? (
                      <span className={`text-xs ${isListening ? 'text-success-color' : 'text-processing-color'}`}>
                        {isListening ? '🎤 监听中' : '⏸️ 已暂停'}
                      </span>
                    ) : (
                      <span className="text-xs text-recording-color">❌ 不支持</span>
                    )}
                    {speechConfidence > 0 && (
                      <span className="text-xs text-text-secondary">
                        置信度: {Math.round(speechConfidence * 100)}%
                      </span>
                    )}
                  </div>
                </div>
                
                {/* 语言检测状态 */}
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-text-secondary">语言检测:</span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      detectedCurrentLanguage === 'zh' ? 'bg-chinese-color text-white' :
                      detectedCurrentLanguage === 'en' ? 'bg-english-color text-white' :
                      detectedCurrentLanguage === 'ms' ? 'bg-malay-color text-white' :
                      'bg-gradient-to-r from-chinese-color via-english-color to-malay-color text-white'
                    }`}>
                      {detectedCurrentLanguage === 'zh' ? '中文' :
                       detectedCurrentLanguage === 'en' ? 'English' :
                       detectedCurrentLanguage === 'ms' ? 'Bahasa Melayu' :
                       '混合语言'}
                    </span>
                    {langDetectionConfidence > 0 && (
                      <span className="text-text-secondary">
                        {Math.round(langDetectionConfidence * 100)}%
                      </span>
                    )}
                  </div>
                </div>

                {/* 语言分布 */}
                {Object.values(languageBreakdown).some(val => val > 0) && (
                  <div className="mt-2 space-y-1">
                    <div className="text-xs text-text-secondary">语言分布:</div>
                    <div className="flex gap-1 text-xs">
                      {languageBreakdown.zh > 0 && (
                        <span className="bg-chinese-color text-white px-1 rounded">
                          中: {Math.round(languageBreakdown.zh * 100)}%
                        </span>
                      )}
                      {languageBreakdown.en > 0 && (
                        <span className="bg-english-color text-white px-1 rounded">
                          En: {Math.round(languageBreakdown.en * 100)}%
                        </span>
                      )}
                      {languageBreakdown.ms > 0 && (
                        <span className="bg-malay-color text-white px-1 rounded">
                          Ms: {Math.round(languageBreakdown.ms * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* 代码切换提示 */}
                {codeSwitchingPoints.length > 0 && (
                  <div className="mt-2 text-xs text-processing-color">
                    检测到 {codeSwitchingPoints.length} 个语言切换点
                  </div>
                )}

                {/* 文化标记 */}
                {culturalMarkers.length > 0 && (
                  <div className="mt-2 text-xs text-success-color">
                    文化标记: {culturalMarkers.slice(0, 3).join(', ')}
                    {culturalMarkers.length > 3 && '...'}
                  </div>
                )}
                
                {/* 实时转录预览 */}
                {interimTranscript && (
                  <div className="mt-2 rounded bg-bg-secondary p-2 text-xs text-text-secondary">
                    <span className="font-medium">实时转录: </span>
                    <span className="italic">{interimTranscript}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Transcript Display Area */}
          <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-bg-tertiary scrollbar-track-bg-secondary">
            <div className="space-y-4">
              {transcripts.length === 0 && (
                <div className="flex h-full items-center justify-center text-text-secondary">
                  <p>开始录音以查看转录内容...</p>
                </div>
              )}
              {transcripts.map((segment) => (
                <TranscriptCard
                  key={segment.id}
                  segment={segment}
                  showTranslation={showTranslations}
                  onTranslate={handleTranslateSegment}
                  onEdit={() => console.log("Edit:", segment.id)}
                />
              ))}
            </div>
          </div>

          {/* Footer / Control Bar */}
          <div className="mt-auto">
            <SmartControlBar
              isRecording={isRecording}
              currentLanguage={currentLanguage}
              onToggleRecording={handleToggleRecording}
              onLanguageChange={handleLanguageChange}
              onToggleTranslation={handleToggleTranslation}
              onExport={handleExport}
            />
          </div>
        </main>

        {/* Right Panel (Placeholder for future features) */}
        <aside className="hidden w-full lg:block lg:w-1/4">
          {selectedTranslationSegmentId ? (
            <TranslationPanel
              originalText={transcripts.find(s => s.id === selectedTranslationSegmentId)?.content || ""}
              translations={transcripts.find(s => s.id === selectedTranslationSegmentId)?.languageData.translations || {}}
              culturalNotes={transcripts.find(s => s.id === selectedTranslationSegmentId)?.languageData.culturalNotes || []}
              onLanguageSelect={setSelectedTranslationLang}
              selectedTranslationLang={selectedTranslationLang}
            />
          ) : (
            <Card className="h-full border-none bg-bg-secondary text-text-primary shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold">附加信息</CardTitle>
              </CardHeader>
              <CardContent className="text-text-secondary">
                <p>点击转录片段以查看翻译和文化注释。</p>
                <p className="mt-2">
                  <WifiIcon className="inline-block h-4 w-4 mr-2 text-success-color" />
                  实时连接稳定。
                </p>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    // </AuthWrapper>
  )
}
