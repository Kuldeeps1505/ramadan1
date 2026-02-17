const express = require('express');
const {
    getUserProgress,
    updateQuranPosition,
    recalculateStreaks,
    getDashboardStats
} = require('../controllers/progressController');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

router.use(requireAuth);

/**
 * @swagger
 * tags:
 *   name: Progress
 *   description: User progress and statistics
 */

/**
 * @swagger
 * /api/progress:
 *   get:
 *     summary: Get user's overall progress
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User progress
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProgress'
 */
router.get('/', getUserProgress);

/**
 * @swagger
 * /api/progress/quran-position:
 *   put:
 *     summary: Update current Quran reading position
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentJuz:
 *                 type: integer
 *               currentSurah:
 *                 type: integer
 *               currentAyah:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Updated progress
 */
router.put('/quran-position', updateQuranPosition);

/**
 * @swagger
 * /api/progress/recalculate-streaks:
 *   post:
 *     summary: Recalculate all streaks
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Updated streaks
 */
router.post('/recalculate-streaks', recalculateStreaks);

/**
 * @swagger
 * /api/progress/dashboard:
 *   get:
 *     summary: Get combined dashboard statistics
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 overall:
 *                   type: object
 *                 quran:
 *                   type: object
 *                 streaks:
 *                   type: object
 *                 today:
 *                   type: object
 */
router.get('/dashboard', getDashboardStats);

module.exports = router;
