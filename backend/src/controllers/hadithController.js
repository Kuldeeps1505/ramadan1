const HadithActivity = require('../models/HadithActivityModel');
const UserProgress = require('../models/UserProgressModel');

/**
 * Log a hadith read activity
 */
exports.logHadithActivity = async (req, res, next) => {
    try {
        const { hadithCollection, hadithNumber, hadithText, learned, favorited, date } = req.body;

        if (!hadithCollection || !hadithNumber) {
            return res.status(400).json({ message: 'hadithCollection and hadithNumber are required' });
        }

        const activityDate = date || new Date().toISOString().split('T')[0];

        // Upsert - update if same hadith read on same day, create if new
        const activity = await HadithActivity.findOneAndUpdate(
            {
                user: req.user._id,
                date: activityDate,
                hadithCollection,
                hadithNumber
            },
            {
                $set: {
                    hadithText: hadithText || '',
                    learned: learned || false,
                    favorited: favorited || false,
                    readAt: new Date()
                }
            },
            { new: true, upsert: true }
        );

        // Update overall stats
        await UserProgress.findOneAndUpdate(
            { user: req.user._id },
            { $inc: { 'stats.totalHadithsRead': 1 } },
            { upsert: true }
        );

        res.status(201).json(activity);
    } catch (error) {
        // Handle duplicate - already logged today, just return success
        if (error.code === 11000) {
            const existing = await HadithActivity.findOne({
                user: req.user._id,
                date: req.body.date || new Date().toISOString().split('T')[0],
                hadithCollection: req.body.hadithCollection,
                hadithNumber: req.body.hadithNumber
            });
            return res.status(200).json(existing);
        }
        next(error);
    }
};

/**
 * Get hadith activities for a specific date
 */
exports.getHadithActivitiesByDate = async (req, res, next) => {
    try {
        const { date } = req.params;
        const activities = await HadithActivity.find({ user: req.user._id, date }).sort({ readAt: -1 });
        res.status(200).json(activities);
    } catch (error) {
        next(error);
    }
};

/**
 * Get all hadith activities (recent first)
 */
exports.getAllHadithActivities = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const activities = await HadithActivity.find({ user: req.user._id })
            .sort({ readAt: -1 })
            .limit(limit);
        res.status(200).json(activities);
    } catch (error) {
        next(error);
    }
};

/**
 * Toggle learned status for a hadith
 */
exports.toggleLearned = async (req, res, next) => {
    try {
        const { hadithCollection, hadithNumber } = req.params;
        const date = new Date().toISOString().split('T')[0];

        const activity = await HadithActivity.findOneAndUpdate(
            { user: req.user._id, hadithCollection, hadithNumber: parseInt(hadithNumber), date },
            [{ $set: { learned: { $not: "$learned" } } }],
            { new: true }
        );

        if (!activity) {
            return res.status(404).json({ message: 'Hadith activity not found for today' });
        }

        res.status(200).json(activity);
    } catch (error) {
        next(error);
    }
};

/**
 * Toggle favorite status for a hadith
 */
exports.toggleFavorite = async (req, res, next) => {
    try {
        const { hadithCollection, hadithNumber } = req.params;
        const { hadithText } = req.body;
        const date = new Date().toISOString().split('T')[0];

        // Find or create the activity for today
        let activity = await HadithActivity.findOne({
            user: req.user._id,
            hadithCollection,
            hadithNumber: parseInt(hadithNumber),
            date
        });

        if (activity) {
            activity.favorited = !activity.favorited;
            await activity.save();
        } else {
            // Create new activity with favorite
            activity = await HadithActivity.create({
                user: req.user._id,
                date,
                hadithCollection,
                hadithNumber: parseInt(hadithNumber),
                hadithText: hadithText || '',
                favorited: true,
                readAt: new Date()
            });
        }

        res.status(200).json(activity);
    } catch (error) {
        next(error);
    }
};

/**
 * Get all favorited hadiths
 */
exports.getFavorites = async (req, res, next) => {
    try {
        const favorites = await HadithActivity.find({ user: req.user._id, favorited: true })
            .sort({ readAt: -1 });
        res.status(200).json(favorites);
    } catch (error) {
        next(error);
    }
};

/**
 * Get learned hadiths count by collection
 */
exports.getLearnedStats = async (req, res, next) => {
    try {
        const stats = await HadithActivity.aggregate([
            { $match: { user: req.user._id, learned: true } },
            { $group: { _id: '$hadithCollection', count: { $sum: 1 } } }
        ]);
        res.status(200).json(stats);
    } catch (error) {
        next(error);
    }
};
