const QuranActivity = require('../models/QuranActivityModel');
const QuranProgress = require('../models/QuranProgressModel');
const UserProgress = require('../models/UserProgressModel');

/**
 * Log a Quran reading activity
 */
exports.logQuranActivity = async (req, res, next) => {
    try {
        const { surahNumber, surahName, startAyah, endAyah, duration, date } = req.body;

        if (!surahNumber || !surahName) {
            return res.status(400).json({ message: 'surahNumber and surahName are required' });
        }

        const activityDate = date || new Date().toISOString().split('T')[0];

        const activity = await QuranActivity.create({
            user: req.user._id,
            date: activityDate,
            surahNumber,
            surahName,
            startAyah: startAyah || 1,
            endAyah: endAyah || startAyah || 1,
            duration: duration || 0,
            readAt: new Date()
        });

        // Update overall progress
        await this.updateQuranProgress(req.user._id, surahNumber, surahName, endAyah, duration);

        res.status(201).json(activity);
    } catch (error) {
        next(error);
    }
};

/**
 * Get Quran activities for a specific date
 */
exports.getQuranActivitiesByDate = async (req, res, next) => {
    try {
        const { date } = req.params;
        const activities = await QuranActivity.find({ user: req.user._id, date }).sort({ readAt: -1 });
        res.status(200).json(activities);
    } catch (error) {
        next(error);
    }
};

/**
 * Get all Quran activities (recent first)
 */
exports.getAllQuranActivities = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const activities = await QuranActivity.find({ user: req.user._id })
            .sort({ readAt: -1 })
            .limit(limit);
        res.status(200).json(activities);
    } catch (error) {
        next(error);
    }
};

/**
 * Get all Quran progress (per surah)
 */
exports.getQuranProgress = async (req, res, next) => {
    try {
        const progress = await QuranProgress.find({ user: req.user._id }).sort({ surahNumber: 1 });
        res.status(200).json(progress);
    } catch (error) {
        next(error);
    }
};

/**
 * Get progress for a specific surah
 */
exports.getSurahProgress = async (req, res, next) => {
    try {
        const { surahNumber } = req.params;
        const progress = await QuranProgress.findOne({ user: req.user._id, surahNumber: parseInt(surahNumber) });
        res.status(200).json(progress || { surahNumber: parseInt(surahNumber), lastReadAyah: 0, bookmarked: false });
    } catch (error) {
        next(error);
    }
};

/**
 * Toggle bookmark for a surah
 */
exports.toggleBookmark = async (req, res, next) => {
    try {
        const { surahNumber } = req.params;
        const { surahName, totalAyahs } = req.body;

        const progress = await QuranProgress.findOneAndUpdate(
            { user: req.user._id, surahNumber: parseInt(surahNumber) },
            [{
                $set: {
                    bookmarked: { $not: "$bookmarked" },
                    surahName: surahName || `Surah ${surahNumber}`,
                    totalAyahs: totalAyahs || 0
                }
            }],
            { new: true, upsert: true }
        );

        res.status(200).json(progress);
    } catch (error) {
        next(error);
    }
};

/**
 * Toggle memorized status for a surah
 */
exports.toggleMemorized = async (req, res, next) => {
    try {
        const { surahNumber } = req.params;
        const { surahName, totalAyahs } = req.body;

        const progress = await QuranProgress.findOneAndUpdate(
            { user: req.user._id, surahNumber: parseInt(surahNumber) },
            [{
                $set: {
                    memorized: { $not: "$memorized" },
                    surahName: surahName || `Surah ${surahNumber}`,
                    totalAyahs: totalAyahs || 0
                }
            }],
            { new: true, upsert: true }
        );

        res.status(200).json(progress);
    } catch (error) {
        next(error);
    }
};

/**
 * Update notes for a surah
 */
exports.updateSurahNotes = async (req, res, next) => {
    try {
        const { surahNumber } = req.params;
        const { notes, surahName, totalAyahs } = req.body;

        const progress = await QuranProgress.findOneAndUpdate(
            { user: req.user._id, surahNumber: parseInt(surahNumber) },
            {
                $set: {
                    notes,
                    surahName: surahName || `Surah ${surahNumber}`,
                    totalAyahs: totalAyahs || 0
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
 * Internal helper to update overall Quran progress
 */
exports.updateQuranProgress = async (userId, surahNumber, surahName, lastReadAyah, duration) => {
    try {
        // Update specific surah progress
        await QuranProgress.findOneAndUpdate(
            { user: userId, surahNumber },
            {
                $set: { surahName, lastReadAyah },
                $setOnInsert: { totalAyahs: 0, completedReads: 0 }
            },
            { upsert: true }
        );

        // Update overall user progress
        await UserProgress.findOneAndUpdate(
            { user: userId },
            {
                $set: {
                    'quranProgress.currentSurah': surahNumber,
                    'quranProgress.currentAyah': lastReadAyah
                },
                $inc: { 'stats.totalQuranMinutes': duration || 0 }
            },
            { upsert: true }
        );
    } catch (error) {
        console.error('Error updating Quran progress:', error);
    }
};

/**
 * Get bookmarked surahs
 */
exports.getBookmarkedSurahs = async (req, res, next) => {
    try {
        const bookmarks = await QuranProgress.find({ user: req.user._id, bookmarked: true }).sort({ surahNumber: 1 });
        res.status(200).json(bookmarks);
    } catch (error) {
        next(error);
    }
};

/**
 * Mark a surah as read (increment completedReads count)
 */
exports.markAsRead = async (req, res, next) => {
    try {
        const { surahNumber } = req.params;
        const { surahName, totalAyahs } = req.body;

        const progress = await QuranProgress.findOneAndUpdate(
            { user: req.user._id, surahNumber: parseInt(surahNumber) },
            {
                $inc: { completedReads: 1 },
                $set: {
                    surahName: surahName || `Surah ${surahNumber}`,
                    totalAyahs: totalAyahs || 0
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
 * Get all surahs that have been read (completedReads > 0)
 */
exports.getReadSurahs = async (req, res, next) => {
    try {
        const readSurahs = await QuranProgress.find({
            user: req.user._id,
            completedReads: { $gt: 0 }
        }).sort({ surahNumber: 1 });
        res.status(200).json(readSurahs);
    } catch (error) {
        next(error);
    }
};
