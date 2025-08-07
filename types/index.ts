export interface Participant {
  id: string;
  name: string;
  position: string;
  avatar?: string;
  languageProfile: {
    primaryLanguage: 'zh' | 'en' | 'ms';
    proficiencyLevels: { [lang: string]: number };
    culturalBackground: string;
    communicationStyle: 'direct' | 'indirect' | 'mixed';
  };
}

export interface LanguageDetection {
  language: string;
  confidence: number;
}

export interface TranscriptSegment {
  id: string;
  speakerId: string;
  content: string;
  timestamp: Date;
  languageData: {
    detectedLanguages: LanguageDetection[];
    primaryLanguage: string;
    confidence: number;
    translations?: { [lang: string]: string };
    culturalNotes?: string[];
  };
  metadata: {
    audioQuality: number;
    backgroundNoise: number;
    speakingSpeed: number;
    emotionalTone: string;
  };
}

export interface MeetingAnalytics {
  languageDistribution: { [lang: string]: number };
  participationBalance: { [participantId: string]: number };
  culturalInclusivity: number;
  communicationEfficiency: number;
  actionItemsExtracted: any[]; // Define ActionItem interface if needed
  keyInsights: string[];
}

export interface SupportedLanguage {
  code: 'zh' | 'en' | 'ms';
  name: string;
  flag: string;
}
