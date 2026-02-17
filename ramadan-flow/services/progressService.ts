import axios from 'axios';
import {
    QuranActivity,
    QuranProgress,
    HadithActivity,
    TasbihSession,
    UserProgress,
    CalendarData
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };
};

// ============ QURAN ============

export const quranService = {
    // Log a reading activity
    logActivity: async (data: {
        surahNumber: number;
        surahName: string;
        startAyah?: number;
        endAyah?: number;
        duration?: number;
        date?: string;
    }): Promise<QuranActivity> => {
        const res = await axios.post(`${API_BASE_URL}/quran/activity`, data, getAuthHeaders());
        return res.data;
    },

    // Get activities for a date
    getActivitiesByDate: async (date: string): Promise<QuranActivity[]> => {
        const res = await axios.get(`${API_BASE_URL}/quran/activity/${date}`, getAuthHeaders());
        return res.data;
    },

    // Get all activities
    getAllActivities: async (limit = 50): Promise<QuranActivity[]> => {
        const res = await axios.get(`${API_BASE_URL}/quran/activity?limit=${limit}`, getAuthHeaders());
        return res.data;
    },

    // Get all surah progress
    getProgress: async (): Promise<QuranProgress[]> => {
        const res = await axios.get(`${API_BASE_URL}/quran/progress`, getAuthHeaders());
        return res.data;
    },

    // Get single surah progress
    getSurahProgress: async (surahNumber: number): Promise<QuranProgress> => {
        const res = await axios.get(`${API_BASE_URL}/quran/progress/${surahNumber}`, getAuthHeaders());
        return res.data;
    },

    // Toggle bookmark
    toggleBookmark: async (surahNumber: number, surahName?: string, totalAyahs?: number): Promise<QuranProgress> => {
        const res = await axios.put(
            `${API_BASE_URL}/quran/bookmark/${surahNumber}`,
            { surahName, totalAyahs },
            getAuthHeaders()
        );
        return res.data;
    },

    // Toggle memorized
    toggleMemorized: async (surahNumber: number, surahName?: string, totalAyahs?: number): Promise<QuranProgress> => {
        const res = await axios.put(
            `${API_BASE_URL}/quran/memorized/${surahNumber}`,
            { surahName, totalAyahs },
            getAuthHeaders()
        );
        return res.data;
    },

    // Update notes
    updateNotes: async (surahNumber: number, notes: string): Promise<QuranProgress> => {
        const res = await axios.put(
            `${API_BASE_URL}/quran/notes/${surahNumber}`,
            { notes },
            getAuthHeaders()
        );
        return res.data;
    },

    // Get bookmarked surahs
    getBookmarks: async (): Promise<QuranProgress[]> => {
        const res = await axios.get(`${API_BASE_URL}/quran/bookmarks`, getAuthHeaders());
        return res.data;
    },

    // Mark surah as read
    markAsRead: async (surahNumber: number, surahName?: string, totalAyahs?: number): Promise<QuranProgress> => {
        const res = await axios.put(
            `${API_BASE_URL}/quran/read/${surahNumber}`,
            { surahName, totalAyahs },
            getAuthHeaders()
        );
        return res.data;
    }
};

// ============ HADITH ============

export const hadithService = {
    // Log a hadith activity
    logActivity: async (data: {
        hadithCollection: string;
        hadithNumber: number;
        hadithText?: string;
        learned?: boolean;
        favorited?: boolean;
        date?: string;
    }): Promise<HadithActivity> => {
        const res = await axios.post(`${API_BASE_URL}/hadith/activity`, data, getAuthHeaders());
        return res.data;
    },

    // Get activities by date
    getActivitiesByDate: async (date: string): Promise<HadithActivity[]> => {
        const res = await axios.get(`${API_BASE_URL}/hadith/activity/${date}`, getAuthHeaders());
        return res.data;
    },

    // Get all activities
    getAllActivities: async (limit = 50): Promise<HadithActivity[]> => {
        const res = await axios.get(`${API_BASE_URL}/hadith/activity?limit=${limit}`, getAuthHeaders());
        return res.data;
    },

    // Toggle learned
    toggleLearned: async (hadithCollection: string, hadithNumber: number): Promise<HadithActivity> => {
        const res = await axios.put(
            `${API_BASE_URL}/hadith/learned/${hadithCollection}/${hadithNumber}`,
            {},
            getAuthHeaders()
        );
        return res.data;
    },

    // Toggle favorite
    toggleFavorite: async (hadithCollection: string, hadithNumber: number, hadithText?: string): Promise<HadithActivity> => {
        const res = await axios.put(
            `${API_BASE_URL}/hadith/favorite/${hadithCollection}/${hadithNumber}`,
            { hadithText },
            getAuthHeaders()
        );
        return res.data;
    },

    // Get favorites
    getFavorites: async (): Promise<HadithActivity[]> => {
        const res = await axios.get(`${API_BASE_URL}/hadith/favorites`, getAuthHeaders());
        return res.data;
    },

    // Get learned stats
    getStats: async (): Promise<{ _id: string; count: number }[]> => {
        const res = await axios.get(`${API_BASE_URL}/hadith/stats`, getAuthHeaders());
        return res.data;
    }
};

// ============ TASBIH ============

export const tasbihService = {
    // Add a session
    addSession: async (data: {
        type: string;
        customText?: string;
        count: number;
        targetCount?: number;
        date?: string;
    }): Promise<TasbihSession> => {
        const res = await axios.post(`${API_BASE_URL}/tasbih`, data, getAuthHeaders());
        return res.data;
    },

    // Get sessions by date
    getSessionsByDate: async (date: string): Promise<{ sessions: TasbihSession[]; totals: Record<string, number> }> => {
        const res = await axios.get(`${API_BASE_URL}/tasbih/date/${date}`, getAuthHeaders());
        return res.data;
    },

    // Get all sessions
    getAllSessions: async (limit = 100): Promise<TasbihSession[]> => {
        const res = await axios.get(`${API_BASE_URL}/tasbih?limit=${limit}`, getAuthHeaders());
        return res.data;
    },

    // Get stats
    getStats: async (): Promise<{
        byType: { _id: string; totalCount: number; sessions: number }[];
        overall: { avgDaily: number; totalDays: number; grandTotal: number };
    }> => {
        const res = await axios.get(`${API_BASE_URL}/tasbih/stats`, getAuthHeaders());
        return res.data;
    },

    // Get today's total
    getTodayTotal: async (): Promise<{ date: string; total: number; breakdown: { _id: string; count: number }[] }> => {
        const res = await axios.get(`${API_BASE_URL}/tasbih/today`, getAuthHeaders());
        return res.data;
    }
};

// ============ CALENDAR ============

export const calendarService = {
    // Get all data for a date
    getByDate: async (date: string): Promise<CalendarData> => {
        const res = await axios.get(`${API_BASE_URL}/calendar/${date}`, getAuthHeaders());
        return res.data;
    },

    // Get summary for a date range
    getRange: async (startDate: string, endDate: string): Promise<Record<string, {
        prayersCompleted?: number;
        surahsRead?: number;
        quranMinutes?: number;
        hadithsRead?: number;
        tasbihTotal?: number;
        fastingStatus?: string;
    }>> => {
        const res = await axios.get(
            `${API_BASE_URL}/calendar?startDate=${startDate}&endDate=${endDate}`,
            getAuthHeaders()
        );
        return res.data;
    }
};

// ============ PROGRESS ============

export const progressService = {
    // Get user progress
    get: async (): Promise<UserProgress> => {
        const res = await axios.get(`${API_BASE_URL}/progress`, getAuthHeaders());
        return res.data;
    },

    // Update Quran position
    updateQuranPosition: async (data: {
        currentJuz?: number;
        currentSurah?: number;
        currentAyah?: number;
    }): Promise<UserProgress> => {
        const res = await axios.put(`${API_BASE_URL}/progress/quran-position`, data, getAuthHeaders());
        return res.data;
    },

    // Recalculate streaks
    recalculateStreaks: async (): Promise<UserProgress['streaks']> => {
        const res = await axios.post(`${API_BASE_URL}/progress/recalculate-streaks`, {}, getAuthHeaders());
        return res.data;
    },

    // Get dashboard stats
    getDashboard: async (): Promise<{
        overall: UserProgress['stats'];
        quran: {
            currentPosition: UserProgress['quranProgress'];
            completedSurahs: number;
            bookmarkedSurahs: { surahNumber: number; surahName: string }[];
        };
        streaks: UserProgress['streaks'];
        today: {
            prayers: Record<string, { prayed: boolean }>;
            tasbihCount: number;
            quranMinutes: number;
        };
    }> => {
        const res = await axios.get(`${API_BASE_URL}/progress/dashboard`, getAuthHeaders());
        return res.data;
    }
};

// ============ DAILY LOG ============

export const dailyLogService = {
    // Get log for a specific date
    getByDate: async (date: string): Promise<any> => {
        const res = await axios.get(`${API_BASE_URL}/logs/${date}`, getAuthHeaders());
        return res.data;
    },

    // Save/update daily log
    save: async (log: {
        date: string;
        prayers?: Record<string, boolean>;
        quranMinutes?: number;
        waterIntake?: number;
        mood?: string;
        journalEntry?: string;
        tasbihCount?: number;
        fastingStatus?: string;
    }): Promise<any> => {
        const res = await axios.post(`${API_BASE_URL}/logs`, log, getAuthHeaders());
        return res.data;
    },

    // Get all logs (for calendar)
    getAll: async (): Promise<any[]> => {
        const res = await axios.get(`${API_BASE_URL}/logs`, getAuthHeaders());
        return res.data;
    },

    // Batch sync logs
    batchSync: async (logs: any[]): Promise<{ message: string; count: number }> => {
        const res = await axios.post(`${API_BASE_URL}/logs/batch`, logs, getAuthHeaders());
        return res.data;
    }
};

// ============ PROFILE ============

export interface UserProfileData {
    _id?: string;
    name: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    calculationMethod?: string;
    asrMethod?: string;
    goalQuranMinutes?: number;
    isOnboarded?: boolean;
}

export const profileService = {
    // Get current user's profile
    getProfile: async (): Promise<UserProfileData> => {
        const res = await axios.get(`${API_BASE_URL}/profile`, getAuthHeaders());
        return res.data;
    },

    // Update profile (including onboarding data)
    updateProfile: async (data: Partial<UserProfileData>): Promise<UserProfileData> => {
        const res = await axios.put(`${API_BASE_URL}/profile`, data, getAuthHeaders());
        return res.data;
    },

    // Save onboarding data and mark as onboarded
    saveOnboarding: async (data: {
        name: string;
        city: string;
        latitude: number;
        longitude: number;
        calculationMethod?: string;
        asrMethod?: string;
        goalQuranMinutes?: number;
    }): Promise<UserProfileData> => {
        const res = await axios.put(`${API_BASE_URL}/profile`, {
            ...data,
            isOnboarded: true
        }, getAuthHeaders());
        return res.data;
    }
};
