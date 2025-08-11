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
import { MeetingHeader } from "@/components/meeting-header"

export default function MeetingPage() {
  // 首先定义状态变量
  const [currentLanguage, setCurrentLanguage] = useState<'zh' | 'en' | 'ms'>("en");
  const [isTestMode, setIsTestMode] = useState(false);
  const [meetingStartTime, setMeetingStartTime] = useState<Date | null>(null);
  const [meetingDuration, setMeetingDuration] = useState("00:00");

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
    testMode: isTestMode,
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
      setMeetingStartTime(new Date());
      startRecording();
      if (speechSupported) {
        startSpeech();
      }
    }
  }, [isInitialized, isRecording, startRecording, stopRecording, startSpeech, stopSpeech, speechSupported])

  // 会议时间跟踪
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording && meetingStartTime) {
      interval = setInterval(() => {
        const now = new Date();
        const diff = now.getTime() - meetingStartTime.getTime();
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setMeetingDuration(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, meetingStartTime]);

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
    <div className="flex h-screen w-full flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Enhanced Meeting Header */}
        <MeetingHeader
          isRecording={isRecording}
          participantCount={participants.length}
          meetingDuration={meetingDuration}
          onToggleRecording={handleToggleRecording}
          onExport={handleExport}
          onShare={() => console.log('Share meeting')}
          onSettings={() => console.log('Open settings')}
        />

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar for Participants (Tablet & Desktop) */}
          <aside className="hidden w-80 lg:block bg-black/20 backdrop-blur-xl border-r border-white/10">
            <div className="p-4 h-full">
              <ParticipantManager
                participants={participants}
                currentSpeakerId={currentSpeakerId}
                onSpeakerChange={setCurrentSpeakerId}
              />
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex flex-1 flex-col overflow-hidden">
            {/* Cultural Event Banner */}
            <div className="p-4 border-b border-white/10">
              <CulturalEventBanner />
            </div>
            
            {/* Audio Visualizer Section */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  实时音频监控
                </h2>
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
            
            {/* 美化的音频错误提示 */}
            {audioError && (
              <div className="audio-error mt-4 rounded-xl bg-gradient-to-r from-red-500/10 to-pink-500/10 backdrop-blur-sm border border-red-500/30 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-red-400 text-sm">⚠️</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-300 mb-3">音频系统错误: {audioError}</p>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => initializeAudio(false)}
                        className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-medium rounded-lg transition-colors border border-red-500/40"
                      >
                        重新初始化
                      </button>
                      <button 
                        onClick={() => {
                          setIsTestMode(true);
                          initializeAudio(true);
                        }}
                        className="px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white text-xs font-medium rounded-lg transition-all shadow-lg"
                      >
                        🧪 使用测试模式
                      </button>
                    </div>
                    <p className="text-xs mt-3 text-red-300/70 bg-red-500/10 rounded-lg p-2">
                      💡 测试模式：不需要麦克风权限，使用模拟音频数据体验完整功能
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* 美化的权限提示 */}
            {!permissionGranted && (
              <div className="permission-prompt mt-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 backdrop-blur-sm border border-amber-500/30 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-amber-400 text-sm">🎤</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-300 mb-3">需要麦克风权限才能开始录制</p>
                    <button 
                      onClick={() => initializeAudio()}
                      className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-medium rounded-lg transition-all shadow-lg"
                    >
                      🔓 授权访问麦克风
                    </button>
                    <p className="text-xs mt-3 text-amber-300/70">
                      点击上方按钮，浏览器将请求麦克风权限
                    </p>
                  </div>
                </div>
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

            {/* Enhanced Transcript Display Area */}
            <div className="flex-1 p-4 overflow-hidden">
              <div className="h-full rounded-xl bg-black/20 backdrop-blur-sm border border-white/10">
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                      转录记录
                      {transcripts.length > 0 && (
                        <span className="ml-2 px-2 py-1 text-xs bg-blue-500/20 text-blue-300 rounded-full">
                          {transcripts.length} 条记录
                        </span>
                      )}
                    </h2>
                    <SmartControlBar
                      isRecording={isRecording}
                      currentLanguage={currentLanguage}
                      onToggleRecording={handleToggleRecording}
                      onLanguageChange={handleLanguageChange}
                      onToggleTranslation={handleToggleTranslation}
                      onExport={handleExport}
                    />
                  </div>
                </div>
                
                <div className="h-full overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                  <div className="space-y-4">
                    {transcripts.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-64 text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mb-4">
                          <span className="text-3xl">🎤</span>
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">准备开始转录</h3>
                        <p className="text-gray-400 max-w-md">
                          点击录制按钮开始会议转录，AI 将实时识别和翻译多语言内容
                        </p>
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

          {/* Enhanced Right Panel */}
          <aside className="hidden w-80 lg:block bg-black/20 backdrop-blur-xl border-l border-white/10">
            <div className="p-4 h-full">
              {selectedTranslationSegmentId ? (
                <TranslationPanel
                  originalText={transcripts.find(s => s.id === selectedTranslationSegmentId)?.content || ""}
                  translations={transcripts.find(s => s.id === selectedTranslationSegmentId)?.languageData.translations || {}}
                  culturalNotes={transcripts.find(s => s.id === selectedTranslationSegmentId)?.languageData.culturalNotes || []}
                  onLanguageSelect={setSelectedTranslationLang}
                  selectedTranslationLang={selectedTranslationLang}
                />
              ) : (
                <div className="h-full rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-700/50 backdrop-blur-sm border border-white/10 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm">📊</span>
                    </div>
                    <h3 className="text-lg font-bold text-white">智能分析</h3>
                  </div>
                  
                  <div className="space-y-4 text-gray-300">
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-sm">点击任意转录片段查看：</p>
                      <ul className="text-xs mt-2 space-y-1 text-gray-400">
                        <li>• 多语言翻译结果</li>
                        <li>• 文化背景注释</li>
                        <li>• 语言切换分析</li>
                      </ul>
                    </div>
                    
                    {transcripts.length > 0 && (
                      <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                        <h4 className="text-sm font-semibold text-blue-300 mb-2">会议统计</h4>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span>转录片段:</span>
                            <span className="text-blue-300">{transcripts.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>参与者:</span>
                            <span className="text-blue-300">{participants.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>会议时长:</span>
                            <span className="text-blue-300">{meetingDuration}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <WifiIcon className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm font-semibold text-emerald-300">连接状态</span>
                      </div>
                      <p className="text-xs text-emerald-400">实时同步已激活</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
    </div>
    // </AuthWrapper>
  )
}
