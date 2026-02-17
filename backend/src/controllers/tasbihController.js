const TasbihSession = require('../models/TasbihSessionModel');
const UserProgress = require('../models/UserProgressModel');
const DailyLog = require('../models/dailyLogModel');

/**
 * Log a tasbih session
 */
exports.addTasbihSession = async (req, res, next) => {
    try {
        const { type, customText, count, targetCount, date } = req.body;

        if (!type || !count) {
            return res.status(400).json({ message: 'type and count are required' });
        }

        const sessionDate = date || new Date().toISOString().split('T')[0];

        const session = await TasbihSession.create({
            user: req.user._id,
            date: sessionDate,
            type,
            customText: type === 'custom' ? customText : '',
            count,
            targetCount: targetCount || 33,
            completedAt: new Date()
        });

        // Update daily log total
        await DailyLog.findOneAndUpdate(
            { user: req.user._id, date: sessionDate },
            { $inc: { tasbihCount: count } },
            { upsert: true }
        );

        // Update overall stats
        await UserProgress.findOneAndUpdate(
            { user: req.user._id },
            { $inc: { 'stats.totalTasbihCount': count } },
            { upsert: true }
        );

        res.status(201).json(session);
    } catch (error) {
        next(error);
    }
};

/**
 * Get tasbih sessions for a specific date
 */
exports.getTasbihSessionsByDate = async (req, res, next) => {
    try {
        const { date } = req.params;
        const sessions = await TasbihSession.find({ user: req.user._id, date }).sort({ completedAt: -1 });

        // Calculate totals by type
        const totals = sessions.reduce((acc, session) => {
            acc[session.type] = (acc[session.type] || 0) + session.count;
            acc.total = (acc.total || 0) + session.count;
            return acc;
        }, {});

        res.status(200).json({ sessions, totals });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all tasbih sessions (recent first)
 */
exports.getAllTasbihSessions = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const sessions = await TasbihSession.find({ user: req.user._id })
            .sort({ completedAt: -1 })
            .limit(limit);
        res.status(200).json(sessions);
    } catch (error) {
        next(error);
    }
};

/**
 * Get tasbih statistics
 */
exports.getTasbihStats = async (req, res, next) => {
    try {
        // Get all-time stats by type
        const statsByType = await TasbihSession.aggregate([
            { $match: { user: req.user._id } },
            {
                $group: {
                    _id: '$type',
                    totalCount: { $sum: '$count' },
                    sessions: { $sum: 1 }
                }
            }
        ]);

        // Get daily average
        const dailyStats = await TasbihSession.aggregate([
            { $match: { user: req.user._id } },
            {
                $group: {
                    _id: '$date',
                    dailyTotal: { $sum: '$count' }
                }
            },
            {
                $group: {
                    _id: null,
                    avgDaily: { $avg: '$dailyTotal' },
                    totalDays: { $sum: 1 },
                    grandTotal: { $sum: '$dailyTotal' }
                }
            }
        ]);

        res.status(200).json({
            byType: statsByType,
            overall: dailyStats[0] || { avgDaily: 0, totalDays: 0, grandTotal: 0 }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get today's tasbih total
 */
exports.getTodayTotal = async (req, res, next) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const sessions = await TasbihSession.aggregate([
            { $match: { user: req.user._id, date: today } },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: '$count' }
                }
            }
        ]);

        const total = sessions.reduce((sum, s) => sum + s.count, 0);
        res.status(200).json({ date: today, total, breakdown: sessions });
    } catch (error) {
        next(error);
    }
};
