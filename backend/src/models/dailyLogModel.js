
/**
 * @swagger
 * components:
 *   schemas:
 *     PrayerStatus:
 *       type: object
 *       properties:
 *         prayed:
 *           type: boolean
 *         prayedAt:
 *           type: string
 *           format: date-time
 *         inCongregation:
 *           type: boolean
 *     DailyLog:
 *       type: object
 *       required:
 *         - user
 *         - date
 *       properties:
 *         user:
 *           type: string
 *           description: User ID
 *         date:
 *           type: string
 *           format: date
 *           description: Date in YYYY-MM-DD format
 *         prayers:
 *           type: object
 *           properties:
 *             Fajr:
 *               $ref: '#/components/schemas/PrayerStatus'
 *             Dhuhr:
 *               $ref: '#/components/schemas/PrayerStatus'
 *             Asr:
 *               $ref: '#/components/schemas/PrayerStatus'
 *             Maghrib:
 *               $ref: '#/components/schemas/PrayerStatus'
 *             Isha:
 *               $ref: '#/components/schemas/PrayerStatus'
 *         tahajjud:
 *           type: object
 *           properties:
 *             prayed: { type: boolean }
 *             prayedAt: { type: string, format: date-time }
 *             rakats: { type: integer }
 *         taraweeh:
 *           type: object
 *           properties:
 *             prayed: { type: boolean }
 *             prayedAt: { type: string, format: date-time }
 *             rakats: { type: integer }
 *         quranMinutes:
 *           type: integer
 *           description: Minutes spent reading Quran
 *         waterIntake:
 *           type: integer
 *           description: Water intake in glasses/units
 *         mood:
 *           type: string
 *           description: User mood
 *         journalEntry:
 *           type: string
 *           description: Journal entry text
 *         tasbihCount:
 *           type: integer
 *           description: Count of Tasbih
 *         fasting:
 *           type: object
 *           properties:
 *             status:
 *               type: string
 *               enum: [completed, broken, skipped, exempt]
 *             difficulty:
 *               type: integer
 *               minimum: 1
 *               maximum: 5
 *             notes:
 *               type: string
 *         quran:
 *           type: object
 *           properties:
 *             completed: { type: boolean }
 *         fastingStatus:
 *           type: string
 *           description: Current fasting status
 * */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Daily Log Schema
const dailyLogSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        date: {
            type: String, // Format YYYY-MM-DD
            required: true,
            index: true
        },
        prayers: {
            Fajr: {
                prayed: { type: Boolean, default: false },
                prayedAt: { type: Date },
                inCongregation: { type: Boolean, default: false }
            },
            Dhuhr: {
                prayed: { type: Boolean, default: false },
                prayedAt: { type: Date },
                inCongregation: { type: Boolean, default: false }
            },
            Asr: {
                prayed: { type: Boolean, default: false },
                prayedAt: { type: Date },
                inCongregation: { type: Boolean, default: false }
            },
            Maghrib: {
                prayed: { type: Boolean, default: false },
                prayedAt: { type: Date },
                inCongregation: { type: Boolean, default: false }
            },
            Isha: {
                prayed: { type: Boolean, default: false },
                prayedAt: { type: Date },
                inCongregation: { type: Boolean, default: false }
            }
        },
        tahajjud: {
            prayed: { type: Boolean, default: false },
            prayedAt: { type: Date },
            rakats: { type: Number }
        },
        taraweeh: {
            prayed: { type: Boolean, default: false },
            prayedAt: { type: Date },
            rakats: { type: Number }
        },
        quranMinutes: { type: Number, default: 0 },
        waterIntake: { type: Number, default: 0 },
        mood: String,
        journalEntry: String,
        tasbihCount: { type: Number, default: 0 },
        fasting: {
            status: {
                type: String,
                enum: ['completed', 'broken', 'skipped', 'exempt'],
                default: 'completed'
            },
            difficulty: { type: Number, min: 1, max: 5 },
            notes: String
        },
        quran: {
            completed: { type: Boolean, default: false }
        },
        fastingStatus: { type: String, default: 'fasting' }
    },
    {
        timestamps: true
    }
);

// Compound index to ensure one log per user per day
dailyLogSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyLog', dailyLogSchema);
