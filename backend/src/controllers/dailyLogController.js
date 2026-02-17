const DailyLog = require('../models/dailyLogModel');

/**
 * @swagger
 * components:
 *   schemas:
 *     DailyLog:
 *       type: object
 *       required:
 *         - user
 *         - date
 *       properties:
 *         date:
 *           type: string
 *           description: YYYY-MM-DD
 *         prayers:
 *           type: object
 *           properties:
 *             Fajr: { type: boolean }
 *             Dhuhr: { type: boolean }
 *             Asr: { type: boolean }
 *             Maghrib: { type: boolean }
 *             Isha: { type: boolean }
 *         quranMinutes:
 *           type: integer
 *         waterIntake:
 *           type: integer
 *         mood:
 *           type: string
 *         journalEntry:
 *           type: string
 *         tasbihCount:
 *           type: integer
 *         fasting:
 *           type: object
 *           properties:
 *             status: { type: string, enum: ['completed', 'broken', 'skipped', 'exempt'] }
 *             difficulty: { type: integer, minimum: 1, maximum: 5 }
 *             notes: { type: string }
 *         quran:
 *           type: object
 *           properties:
 *             completed: { type: boolean }
 *         fastingStatus:
 *           type: string
 */

// Get logger for today or specific date
exports.getDailyLog = async (req, res, next) => {
    try {
        const { date } = req.params;
        const log = await DailyLog.findOne({ user: req.user._id, date });

        if (!log) {
            // Return default structure log if not found, but don't save it yet
            return res.status(200).json({
                date,
                prayers: { Fajr: false, Dhuhr: false, Asr: false, Maghrib: false, Isha: false },
                quranMinutes: 0,
                waterIntake: 0,
                tasbihCount: 0,
                quran: { completed: false },
                fastingStatus: 'fasting'
            });
        }

        res.status(200).json(log);
    } catch (error) {
        next(error);
    }
};

// Get multiple logs (e.g. for calendar view)
exports.getAllLogs = async (req, res, next) => {
    try {
        const logs = await DailyLog.find({ user: req.user._id }).sort({ date: -1 });
        // Transform array to map if frontend needs it, or just return array
        // Frontend storage.ts getAllLogs returns Record<string, DailyLog>
        // But backend usually returns array. Let's return array, frontend can map if needed
        // OR better, return map key'd by date to match frontend expectation if possible?
        // Standard REST is array. Let's return array. Frontend API service will handle transformation.
        res.status(200).json(logs);
    } catch (error) {
        next(error);
    }
}

// Upsert daily log
exports.saveDailyLog = async (req, res, next) => {
    try {
        const { date } = req.body;
        if (!date) {
            return res.status(400).json({ message: 'Date is required' });
        }

        const userId = req.user._id;
        const updates = req.body;
        delete updates.user; // Protect user field

        const log = await DailyLog.findOneAndUpdate(
            { user: userId, date },
            { $set: { ...updates, user: userId } },
            { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
        );

        res.status(200).json(log);
    } catch (error) {
        next(error);
    }
};

exports.batchSaveLogs = async (req, res, next) => {
    try {
        const logs = req.body; // Expects array of logs
        if (!Array.isArray(logs)) {
            return res.status(400).json({ message: 'Array of logs required' });
        }

        const operations = logs.map(log => ({
            updateOne: {
                filter: { user: req.user._id, date: log.date },
                update: { $set: { ...log, user: req.user._id } },
                upsert: true
            }
        }));

        if (operations.length > 0) {
            await DailyLog.bulkWrite(operations);
        }

        res.status(200).json({ message: 'Batch sync successful', count: operations.length });
    } catch (error) {
        next(error);
    }
}
