const UserProgress = require('../models/UserProgressModel');
const QuranProgress = require('../models/QuranProgressModel');
const DailyLog = require('../models/dailyLogModel');

/**
 * Get user's overall progress
 */
exports.getUserProgress = async (req, res, next) => {
    try {
        let progress = await UserProgress.findOne({ user: req.user._id });

        if (!progress) {
            // Create default progress document
            progress = await UserProgress.create({
                user: req.user._id,
                quranProgress: { currentJuz: 1, currentSurah: 1, currentAyah: 1, totalSurahsCompleted: 0 },
                stats: { totalQuranMinutes: 0, totalTasbihCount: 0, totalHadithsRead: 0, totalPrayersCompleted: 0 },
                streaks: { currentPrayerStreak: 0, bestPrayerStreak: 0, currentQuranStreak: 0, bestQuranStreak: 0 }
            });
        }

        res.status(200).json(progress);
    } catch (error) {
        next(error);
    }
};

/**
 * Update user's current Quran position
 */
exports.updateQuranPosition = async (req, res, next) => {
    try {
        const { currentJuz, currentSurah, currentAyah } = req.body;

        const progress = await UserProgress.findOneAndUpdate(
            { user: req.user._id },
            {
                $set: {
                    'quranProgress.currentJuz': currentJuz,
                    'quranProgress.currentSurah': currentSurah,
                    'quranProgress.currentAyah': currentAyah
                }
            },
            { new: true, upsert: true }
        );

        res.status(200).json(progress);
    } catch (error) {
        next(error);
    }
};

/**
 * Recalculate and update streaks
 */
exports.recalculateStreaks = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const today = new Date().toISOString().split('T')[0];

        // Get recent daily logs to calculate streaks
        const recentLogs = await DailyLog.find({ user: userId })
            .sort({ date: -1 })
            .limit(60); // Last 60 days

        let currentPrayerStreak = 0;
        let currentQuranStreak = 0;
        let currentFastingStreak = 0;

        // Calculate streaks from most recent
        for (const log of recentLogs) {
            const prayers = log.prayers || {};
            const allPrayed = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']
                .every(p => prayers[p]?.prayed);

            if (allPrayed && currentPrayerStreak === recentLogs.indexOf(log)) {
                currentPrayerStreak++;
            }

            if (log.quranMinutes > 0 && currentQuranStreak === recentLogs.indexOf(log)) {
                currentQuranStreak++;
            }

            if (log.fasting?.status === 'completed' && currentFastingStreak === recentLogs.indexOf(log)) {
                currentFastingStreak++;
            }
        }

        // Update progress with new streaks
        const progress = await UserProgress.findOneAndUpdate(
            { user: userId },
            {
                $set: {
                    'streaks.currentPrayerStreak': currentPrayerStreak,
                    'streaks.currentQuranStreak': currentQuranStreak,
                    'streaks.currentFastingStreak': currentFastingStreak,
                    'streaks.lastPrayerDate': today,
                    'streaks.lastQuranDate': today,
                    'streaks.lastFastingDate': today
                },
                $max: {
                    'streaks.bestPrayerStreak': currentPrayerStreak,
                    'streaks.bestQuranStreak': currentQuranStreak,
                    'streaks.bestFastingStreak': currentFastingStreak
                }
            },
            { new: true, upsert: true }
        );

        res.status(200).json(progress.streaks);
    } catch (error) {
        next(error);
    }
};

/**
 * Get combined dashboard stats
 */
exports.getDashboardStats = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const today = new Date().toISOString().split('T')[0];

        const [progress, quranProgress, todayLog] = await Promise.all([
            UserProgress.findOne({ user: userId }),
            QuranProgress.find({ user: userId }),
            DailyLog.findOne({ user: userId, date: today })
        ]);

        // Calculate surahs completed (fully read at least once)
        const completedSurahs = quranProgress.filter(p => p.completedReads > 0).length;
        const bookmarkedSurahs = quranProgress.filter(p => p.bookmarked).map(p => ({
            surahNumber: p.surahNumber,
            surahName: p.surahName
        }));

        res.status(200).json({
            overall: progress?.stats || { totalQuranMinutes: 0, totalTasbihCount: 0, totalHadithsRead: 0, totalPrayersCompleted: 0 },
            quran: {
                currentPosition: progress?.quranProgress || { currentJuz: 1, currentSurah: 1, currentAyah: 1 },
                completedSurahs,
                bookmarkedSurahs
            },
            streaks: progress?.streaks || {},
            today: {
                prayers: todayLog?.prayers || {},
                tasbihCount: todayLog?.tasbihCount || 0,
                quranMinutes: todayLog?.quranMinutes || 0
            }
        });
    } catch (error) {
        next(error);
    }
};
