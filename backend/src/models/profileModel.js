const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Embedded Goal Schema
const goalSchema = new Schema({
    quranTarget: { type: Number, default: 1 },
    quranUnit: { type: String, default: 'Juz' },
    completionDays: Number,
    currentJuz: { type: Number, default: 1 },
    lastReadAyah: String
}, { _id: false });

// Embedded Blessing Tracker Schema
const blessingSchema = new Schema({
    lastDate: String,
    index: { type: Number, default: 0 }
}, { _id: false });

const profileSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true
        },
        isOnboarded: {
            type: Boolean,
            default: false
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        city: String,
        latitude: Number,
        longitude: Number,
        calculationMethod: {
            type: String,
            default: 'Muslim World League'
        },
        asrMethod: {
            type: String,
            default: 'Standard (Shafi, Maliki, Hanbali)'
        },
        goalQuranMinutes: {
            type: Number,
            default: 30
        },
        maritalStatus: String,
        lastTenNightsMode: {
            type: Boolean,
            default: false
        },
        // Embedded Objects
        goals: {
            type: goalSchema,
            default: () => ({})
        },
        blessingTracker: {
            type: blessingSchema,
            default: () => ({})
        }
    },
    { timestamps: true }
);

/**
 * @swagger
 * components:
 *   schemas:
 *     GoalConfig:
 *       type: object
 *       properties:
 *         quranTarget:
 *           type: integer
 *         quranUnit:
 *           type: string
 *         completionDays:
 *           type: integer
 *         currentJuz:
 *           type: integer
 *         lastReadAyah:
 *           type: string
 *     BlessingTracker:
 *       type: object
 *       properties:
 *         lastDate:
 *           type: string
 *           description: ISO date string
 *         index:
 *           type: integer
 *     Profile:
 *       type: object
 *       required:
 *         - user
 *         - name
 *       properties:
 *         isOnboarded:
 *           type: boolean
 *         name:
 *           type: string
 *         city:
 *           type: string
 *         latitude:
 *           type: number
 *         longitude:
 *           type: number
 *         calculationMethod:
 *           type: string
 *         asrMethod:
 *           type: string
 *         goalQuranMinutes:
 *           type: number
 *         maritalStatus:
 *           type: string
 *         lastTenNightsMode:
 *           type: boolean
 *         goals:
 *           $ref: '#/components/schemas/GoalConfig'
 *         blessingTracker:
 *           $ref: '#/components/schemas/BlessingTracker'
 */

module.exports = mongoose.model('Profile', profileSchema);
