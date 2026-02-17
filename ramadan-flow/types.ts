export enum CalculationMethod {
  MWL = 'Muslim World League',
  ISNA = 'ISNA',
  Egypt = 'Egyptian General Authority',
  Makkah = 'Umm al-Qura',
  Karachi = 'University of Islamic Sciences, Karachi',
}

export enum AsrMethod {
  Standard = 'Standard (Shafi, Maliki, Hanbali)',
  Hanafi = 'Hanafi',
}

export enum MaritalStatus {
  Yes = 'Married',
  No = 'Single'
}

export interface UserProfile {
  isOnboarded: boolean;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
  calculationMethod: CalculationMethod;
  asrMethod: AsrMethod;
  goalQuranMinutes: number;
  maritalStatus?: MaritalStatus;
  lastTenNightsMode?: boolean;
}

export interface GoalConfig {
  quranTarget: number;
  quranUnit: string;
  completionDays?: number;
  currentJuz?: number;
  lastReadAyah?: string;
}

export interface PrayerTime {
  name: string;
  time: string;
  dateObj: Date;
  isNext: boolean;
  isPast: boolean;
}

export interface FastingDay {
  date: string;
  status: 'completed' | 'broken' | 'skipped' | 'exempt';
  difficulty: 1 | 2 | 3 | 4 | 5;
  notes: string;
}

// Enhanced prayer status with timestamp and congregation
export interface PrayerStatus {
  prayed: boolean;
  prayedAt?: Date;
  inCongregation?: boolean;
}

// Enhanced DailyLog with detailed prayer tracking
export interface DailyLog {
  date: string;
  prayers: {
    Fajr: PrayerStatus;
    Dhuhr: PrayerStatus;
    Asr: PrayerStatus;
    Maghrib: PrayerStatus;
    Isha: PrayerStatus;
  };
  tahajjud?: { prayed: boolean; prayedAt?: Date; rakats?: number };
  taraweeh?: { prayed: boolean; prayedAt?: Date; rakats?: number };
  quranMinutes: number;
  waterIntake: number;
  mood?: string;
  journalEntry?: string;
  tasbihCount: number;
  fasting: FastingDay | null;
  quran: { completed: boolean };
  fastingStatus?: string;
}

// Quran Activity - logged for each reading session
export interface QuranActivity {
  _id?: string;
  date: string;
  surahNumber: number;
  surahName: string;
  startAyah?: number;
  endAyah?: number;
  duration?: number;
  readAt: Date;
}

// Quran Progress - per surah overall progress
export interface QuranProgress {
  surahNumber: number;
  surahName: string;
  totalAyahs: number;
  lastReadAyah: number;
  completedReads: number;
  memorized: boolean;
  bookmarked: boolean;
  notes?: string;
}

// Hadith Activity
export interface HadithActivity {
  _id?: string;
  date: string;
  hadithCollection: string;
  hadithNumber: number;
  hadithText?: string;
  readAt: Date;
  learned: boolean;
  favorited: boolean;
}

// Tasbih Session
export interface TasbihSession {
  _id?: string;
  date: string;
  type: 'SubhanAllah' | 'Alhamdulillah' | 'AllahuAkbar' | 'LaIlahaIllallah' | 'Astaghfirullah' | 'custom';
  customText?: string;
  count: number;
  targetCount?: number;
  completedAt: Date;
}

// User Progress - overall stats
export interface UserProgress {
  quranProgress: {
    currentJuz: number;
    currentSurah: number;
    currentAyah: number;
    totalSurahsCompleted: number;
  };
  stats: {
    totalQuranMinutes: number;
    totalTasbihCount: number;
    totalHadithsRead: number;
    totalPrayersCompleted: number;
  };
  streaks: {
    currentPrayerStreak: number;
    bestPrayerStreak: number;
    currentQuranStreak: number;
    bestQuranStreak: number;
    currentFastingStreak: number;
    bestFastingStreak: number;
  };
}

// Calendar Data - aggregated daily view
export interface CalendarData {
  date: string;
  summary: {
    prayersCompleted: number;
    surahsRead: number;
    totalQuranMinutes: number;
    hadithsRead: number;
    tasbihTotal: number;
  };
  dailyLog: DailyLog | null;
  quranActivities: QuranActivity[];
  hadithActivities: HadithActivity[];
  tasbihSessions: TasbihSession[];
  tasbihTotals: Record<string, number>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type: 'text' | 'dua_card' | 'video_card';
  metadata?: any;
}

export interface DuaResult {
  arabic: string;
  transliteration: string;
  translation: string;
  source: string;
  context: string;
}

export interface SpiritInsight {
  mood: string;
  dua: DuaResult;
  wisdom: string;
  action: string;
}

export interface VideoResult {
  title: string;
  channel: string;
  thumbnail: string;
  duration: string;
}

export interface Recipe {
  title: string;
  description: string;
  tags: string[];
  prepTime: string;
}

export interface Ayah {
  number: number;
  text: string;
  translation: string;
  tafsir: string;
  surah: string;
}