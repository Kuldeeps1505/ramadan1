/**
 * @swagger
 * components:
 *   schemas:
 *     UserProgress:
 *       type: object
 *       required:
 *         - user
 *       properties:
 *         user:
 *           type: string
 *           description: User ID
 *         quranProgress:
 *           type: object
 *           properties:
 *             currentJuz:
 *               type: integer
 *               minimum: 1
 *               maximum: 30
 *             currentSurah:
 *               type: integer
 *               minimum: 1
 *               maximum: 114
 *             currentAyah:
 *               type: integer
 *             totalSurahsCompleted:
 *               type: integer
 *         stats:
 *           type: object
 *           properties:
 *             totalQuranMinutes:
 *               type: integer
 *             totalTasbihCount:
 *               type: integer
 *             totalHadithsRead:
 *               type: integer
 *             totalPrayersCompleted:
 *               type: integer
 *         streaks:
 *           type: object
 *           properties:
 *             currentPrayerStreak:
 *               type: integer
 *             bestPrayerStreak:
 *               type: integer
 *             currentQuranStreak:
 *               type: integer
 *             bestQuranStreak:
 *               type: integer
 *             currentFastingStreak:
 *               type: integer
 *             bestFastingStreak:
 *               type: integer
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userProgressSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true
        },

        // Quran overall progress
        quranProgress: {
            currentJuz: { type: Number, default: 1, min: 1, max: 30 },
            currentSurah: { type: Number, default: 1, min: 1, max: 114 },
            currentAyah: { type: Number, default: 1 },
            totalSurahsCompleted: { type: Number, default: 0 }
        },

        // Cumulative statistics
        stats: {
            totalQuranMinutes: { type: Number, default: 0 },
            totalTasbihCount: { type: Number, default: 0 },
            totalHadithsRead: { type: Number, default: 0 },
            totalPrayersCompleted: { type: Number, default: 0 }
        },

        // Streak tracking
        streaks: {
            currentPrayerStreak: { type: Number, default: 0 },
            bestPrayerStreak: { type: Number, default: 0 },
            currentQuranStreak: { type: Number, default: 0 },
            bestQuranStreak: { type: Number, default: 0 },
            currentFastingStreak: { type: Number, default: 0 },
            bestFastingStreak: { type: Number, default: 0 },
            lastPrayerDate: { type: String }, // YYYY-MM-DD
            lastQuranDate: { type: String },
            lastFastingDate: { type: String }
        }
    },
    { timestamps: true }
);

// One progress document per user
userProgressSchema.index({ user: 1 }, { unique: true });

module.exports = mongoose.model('UserProgress', userProgressSchema);
