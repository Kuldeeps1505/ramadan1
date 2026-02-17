/**
 * @swagger
 * components:
 *   schemas:
 *     HadithActivity:
 *       type: object
 *       required:
 *         - user
 *         - date
 *         - collection
 *         - hadithNumber
 *       properties:
 *         user:
 *           type: string
 *           description: User ID
 *         date:
 *           type: string
 *           format: date
 *           description: Date in YYYY-MM-DD format
 *         collection:
 *           type: string
 *           enum: [bukhari, muslim, tirmidhi, abudawud, nasai, ibnmajah]
 *         hadithNumber:
 *           type: integer
 *         hadithText:
 *           type: string
 *           description: Hadith content preview
 *         readAt:
 *           type: string
 *           format: date-time
 *         learned:
 *           type: boolean
 *         favorited:
 *           type: boolean
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const hadithActivitySchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        date: {
            type: String, // YYYY-MM-DD
            required: true
        },
        hadithCollection: {
            type: String,
            required: true,
            enum: ['bukhari', 'muslim', 'tirmidhi', 'abudawud', 'nasai', 'ibnmajah']
        },
        hadithNumber: {
            type: Number,
            required: true
        },
        hadithText: {
            type: String, // Store preview/snippet
            default: ''
        },
        readAt: {
            type: Date,
            default: Date.now
        },
        learned: {
            type: Boolean,
            default: false
        },
        favorited: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

// Compound index for calendar queries
hadithActivitySchema.index({ user: 1, date: 1 });
// Unique constraint: same hadith can only be logged once per day per user
hadithActivitySchema.index({ user: 1, date: 1, hadithCollection: 1, hadithNumber: 1 }, { unique: true });
// Index for favorites
hadithActivitySchema.index({ user: 1, favorited: 1 });

module.exports = mongoose.model('HadithActivity', hadithActivitySchema);
