const QuranActivity = require('../models/QuranActivityModel');
const HadithActivity = require('../models/HadithActivityModel');
const TasbihSession = require('../models/TasbihSessionModel');
const DailyLog = require('../models/dailyLogModel');

/**
 * Get all activities for a specific date (Calendar view)
 */
exports.getCalendarData = async (req, res, next) => {
    try {
        const { date } = req.params;
        const userId = req.user._id;

        // Fetch all data in parallel
        const [dailyLog, quranActivities, hadithActivities, tasbihSessions] = await Promise.all([
            DailyLog.findOne({ user: userId, date }),
            QuranActivity.find({ user: userId, date }).sort({ readAt: -1 }),
            HadithActivity.find({ user: userId, date }).sort({ readAt: -1 }),
            TasbihSession.find({ user: userId, date }).sort({ completedAt: -1 })
        ]);

        // Calculate tasbih totals by type
        const tasbihTotals = tasbihSessions.reduce((acc, session) => {
            acc[session.type] = (acc[session.type] || 0) + session.count;
            acc.total = (acc.total || 0) + session.count;
            return acc;
        }, { total: 0 });

        // Calculate prayer count
        const prayers = dailyLog?.prayers || {};
        const prayerCount = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']
            .filter(p => prayers[p]?.prayed).length;

        res.status(200).json({
            date,
            summary: {
                prayersCompleted: prayerCount,
                surahsRead: [...new Set(quranActivities.map(a => a.surahNumber))].length,
                totalQuranMinutes: quranActivities.reduce((sum, a) => sum + (a.duration || 0), 0),
                hadithsRead: hadithActivities.length,
                tasbihTotal: tasbihTotals.total
            },
            dailyLog: dailyLog || null,
            quranActivities,
            hadithActivities,
            tasbihSessions,
            tasbihTotals
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get calendar summary for a date range (for calendar overview)
 */
exports.getCalendarRange = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const userId = req.user._id;

        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'startDate and endDate are required' });
        }

        // Get daily logs for the range
        const dailyLogs = await DailyLog.find({
            user: userId,
            date: { $gte: startDate, $lte: endDate }
        }).sort({ date: 1 });

        // Get activity counts per day
        const [quranCounts, hadithCounts, tasbihCounts] = await Promise.all([
            QuranActivity.aggregate([
                { $match: { user: userId, date: { $gte: startDate, $lte: endDate } } },
                { $group: { _id: '$date', count: { $sum: 1 }, minutes: { $sum: '$duration' } } }
            ]),
            HadithActivity.aggregate([
                { $match: { user: userId, date: { $gte: startDate, $lte: endDate } } },
                { $group: { _id: '$date', count: { $sum: 1 } } }
            ]),
            TasbihSession.aggregate([
                { $match: { user: userId, date: { $gte: startDate, $lte: endDate } } },
                { $group: { _id: '$date', count: { $sum: '$count' } } }
            ])
        ]);

        // Build summary per date
        const summaryByDate = {};

        dailyLogs.forEach(log => {
            const prayers = log.prayers || {};
            summaryByDate[log.date] = {
                prayersCompleted: ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']
                    .filter(p => prayers[p]?.prayed).length,
                fastingStatus: log.fasting?.status || 'completed'
            };
        });

        quranCounts.forEach(q => {
            summaryByDate[q._id] = summaryByDate[q._id] || {};
            summaryByDate[q._id].surahsRead = q.count;
            summaryByDate[q._id].quranMinutes = q.minutes;
        });

        hadithCounts.forEach(h => {
            summaryByDate[h._id] = summaryByDate[h._id] || {};
            summaryByDate[h._id].hadithsRead = h.count;
        });

        tasbihCounts.forEach(t => {
            summaryByDate[t._id] = summaryByDate[t._id] || {};
            summaryByDate[t._id].tasbihTotal = t.count;
        });

        res.status(200).json(summaryByDate);
    } catch (error) {
        next(error);
    }
};
