/**
 * @swagger
 * components:
 *   schemas:
 *     QuranProgress:
 *       type: object
 *       required:
 *         - user
 *         - surahNumber
 *       properties:
 *         user:
 *           type: string
 *           description: User ID
 *         surahNumber:
 *           type: integer
 *           minimum: 1
 *           maximum: 114
 *         surahName:
 *           type: string
 *         totalAyahs:
 *           type: integer
 *         lastReadAyah:
 *           type: integer
 *           description: Current reading position
 *         completedReads:
 *           type: integer
 *           description: Number of times fully read
 *         memorized:
 *           type: boolean
 *         bookmarked:
 *           type: boolean
 *         notes:
 *           type: string
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const quranProgressSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        surahNumber: {
            type: Number,
            required: true,
            min: 1,
            max: 114
        },
        surahName: {
            type: String,
            required: true
        },
        totalAyahs: {
            type: Number,
            required: true
        },
        lastReadAyah: {
            type: Number,
            default: 0 // 0 means not started
        },
        completedReads: {
            type: Number,
            default: 0
        },
        memorized: {
            type: Boolean,
            default: false
        },
        bookmarked: {
            type: Boolean,
            default: false
        },
        notes: {
            type: String,
            default: ''
        }
    },
    { timestamps: true }
);

// One progress record per user per surah
quranProgressSchema.index({ user: 1, surahNumber: 1 }, { unique: true });

module.exports = mongoose.model('QuranProgress', quranProgressSchema);
