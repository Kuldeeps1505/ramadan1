import { UserProfile, DailyLog, GoalConfig } from '../types';
import { DEFAULT_PROFILE } from '../constants';

const KEYS = {
  PROFILE: 'rf_profile_v2',
  LOGS: 'rf_logs_v2',
  GOALS: 'rf_goals_v2',
  BLESSING: 'rf_blessing_tracker'
};

export const storage = {
  getProfile: (): UserProfile => {
    const data = localStorage.getItem(KEYS.PROFILE);
    return data ? JSON.parse(data) : DEFAULT_PROFILE;
  },

  saveProfile: (profile: UserProfile) => {
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
  },

  getDailyLog: (date: string): DailyLog => {
    const logs = JSON.parse(localStorage.getItem(KEYS.LOGS) || '{}');
    return logs[date] || {
      date,
      prayers: { Fajr: false, Dhuhr: false, Asr: false, Maghrib: false, Isha: false },
      quranMinutes: 0,
      waterIntake: 0,
      mood: undefined,
      journalEntry: '',
      tasbihCount: 0,
      fasting: null, 
      quran: { completed: false },
      fastingStatus: 'fasting' // Default assumption during Ramadan
    };
  },

  // New method to retrieve all history for stats
  getAllLogs: (): Record<string, DailyLog> => {
    return JSON.parse(localStorage.getItem(KEYS.LOGS) || '{}');
  },

  saveDailyLog: (log: DailyLog) => {
    const logs = JSON.parse(localStorage.getItem(KEYS.LOGS) || '{}');
    logs[log.date] = log;
    localStorage.setItem(KEYS.LOGS, JSON.stringify(logs));
  },
  
  clearAll: () => {
    localStorage.clear();
    window.location.reload();
  },

  getGoals: (): GoalConfig => {
    const data = localStorage.getItem(KEYS.GOALS);
    return data ? JSON.parse(data) : { quranTarget: 1, quranUnit: 'Juz' };
  },

  saveGoals: (goals: GoalConfig) => {
    localStorage.setItem(KEYS.GOALS, JSON.stringify(goals));
  },

  getBlessingTracker: () => {
    const data = localStorage.getItem(KEYS.BLESSING);
    return data ? JSON.parse(data) : { lastDate: '', index: 0 };
  },

  saveBlessingTracker: (date: string, index: number) => {
    localStorage.setItem(KEYS.BLESSING, JSON.stringify({ lastDate: date, index }));
  },

  exportData: () => {
    const data = JSON.stringify(localStorage);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "ramadan_flow_backup.json";
    a.click();
    URL.revokeObjectURL(url);
  }
};