/**
 * @swagger
 * components:
 *   schemas:
 *     TasbihSession:
 *       type: object
 *       required:
 *         - user
 *         - date
 *         - type
 *         - count
 *       properties:
 *         user:
 *           type: string
 *           description: User ID
 *         date:
 *           type: string
 *           format: date
 *           description: Date in YYYY-MM-DD format
 *         type:
 *           type: string
 *           enum: [SubhanAllah, Alhamdulillah, AllahuAkbar, LaIlahaIllallah, Astaghfirullah, custom]
 *         customText:
 *           type: string
 *           description: Custom dhikr text when type is 'custom'
 *         count:
 *           type: integer
 *           minimum: 1
 *         targetCount:
 *           type: integer
 *           description: Target count (33, 100, etc.)
 *         completedAt:
 *           type: string
 *           format: date-time
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tasbihSessionSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        date: {
            type: String, // YYYY-MM-DD
            required: true,
            index: true
        },
        type: {
            type: String,
            required: true,
            enum: ['SubhanAllah', 'Alhamdulillah', 'AllahuAkbar', 'LaIlahaIllallah', 'Astaghfirullah', 'custom']
        },
        customText: {
            type: String,
            default: ''
        },
        count: {
            type: Number,
            required: true,
            min: 1
        },
        targetCount: {
            type: Number,
            default: 33
        },
        completedAt: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

// Compound index for calendar queries
tasbihSessionSchema.index({ user: 1, date: 1 });
// Index for getting recent sessions
tasbihSessionSchema.index({ user: 1, completedAt: -1 });

module.exports = mongoose.model('TasbihSession', tasbihSessionSchema);
