/**
 * @swagger
 * components:
 *   schemas:
 *     QuranActivity:
 *       type: object
 *       required:
 *         - user
 *         - date
 *         - surahNumber
 *       properties:
 *         user:
 *           type: string
 *           description: User ID
 *         date:
 *           type: string
 *           format: date
 *           description: Date in YYYY-MM-DD format
 *         surahNumber:
 *           type: integer
 *           minimum: 1
 *           maximum: 114
 *         surahName:
 *           type: string
 *         startAyah:
 *           type: integer
 *           minimum: 1
 *         endAyah:
 *           type: integer
 *           minimum: 1
 *         readAt:
 *           type: string
 *           format: date-time
 *         duration:
 *           type: integer
 *           description: Minutes spent reading
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const quranActivitySchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        date: {
            type: String, // YYYY-MM-DD for easy calendar queries
            required: true,
            index: true
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
        startAyah: {
            type: Number,
            min: 1,
            default: 1
        },
        endAyah: {
            type: Number,
            min: 1
        },
        readAt: {
            type: Date,
            default: Date.now
        },
        duration: {
            type: Number, // Minutes spent
            default: 0
        }
    },
    { timestamps: true }
);

// Compound index for efficient calendar queries
quranActivitySchema.index({ user: 1, date: 1 });
// Index for getting recent activities
quranActivitySchema.index({ user: 1, readAt: -1 });

module.exports = mongoose.model('QuranActivity', quranActivitySchema);
