const express = require('express');
const {
    getCalendarData,
    getCalendarRange
} = require('../controllers/calendarController');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

router.use(requireAuth);

/**
 * @swagger
 * tags:
 *   name: Calendar
 *   description: Calendar view - all activities for a date
 */

/**
 * @swagger
 * /api/calendar/{date}:
 *   get:
 *     summary: Get all activities for a specific date
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *         description: Date in YYYY-MM-DD format
 *     responses:
 *       200:
 *         description: All activities for the date
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 date:
 *                   type: string
 *                 summary:
 *                   type: object
 *                   properties:
 *                     prayersCompleted:
 *                       type: integer
 *                     surahsRead:
 *                       type: integer
 *                     totalQuranMinutes:
 *                       type: integer
 *                     hadithsRead:
 *                       type: integer
 *                     tasbihTotal:
 *                       type: integer
 *                 dailyLog:
 *                   $ref: '#/components/schemas/DailyLog'
 *                 quranActivities:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/QuranActivity'
 *                 hadithActivities:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/HadithActivity'
 *                 tasbihSessions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TasbihSession'
 */
router.get('/:date', getCalendarData);

/**
 * @swagger
 * /api/calendar:
 *   get:
 *     summary: Get calendar summary for a date range
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *         description: Start date YYYY-MM-DD
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *         description: End date YYYY-MM-DD
 *     responses:
 *       200:
 *         description: Summary per date in range
 */
router.get('/', getCalendarRange);

module.exports = router;
