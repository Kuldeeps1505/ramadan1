const express = require('express');
const { getDailyLog, saveDailyLog, getAllLogs, batchSaveLogs } = require('../controllers/dailyLogController');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

router.use(requireAuth);

/**
 * @swagger
 * /logs:
 *   get:
 *     summary: Get all daily logs for the user
 *     tags: [DailyLog]
 *     responses:
 *       200:
 *         description: List of daily logs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DailyLog'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 *   post:
 *     summary: Create or update a daily log
 *     tags: [DailyLog]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DailyLog'
 *     responses:
 *       200:
 *         description: The saved daily log
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DailyLog'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 * 
 * /logs/batch:
 *   post:
 *     summary: Batch create/update logs (Sync)
 *     tags: [DailyLog]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/DailyLog'
 *     responses:
 *       200:
 *         description: Sync successful
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 * 
 * /logs/{date}:
 *   get:
 *     summary: Get log for a specific date
 *     tags: [DailyLog]
 *     parameters:
 *       - in: path
 *         name: date
 *         schema:
 *           type: string
 *         required: true
 *         description: Date in YYYY-MM-DD format
 *     responses:
 *       200:
 *         description: Daily Log
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DailyLog'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Log not found
 *       500:
 *         description: Server error
 */

router.get('/', getAllLogs);
router.post('/', saveDailyLog);
router.post('/batch', batchSaveLogs);
router.get('/:date', getDailyLog);

module.exports = router;
