const express = require('express');
const {
    addTasbihSession,
    getTasbihSessionsByDate,
    getAllTasbihSessions,
    getTasbihStats,
    getTodayTotal
} = require('../controllers/tasbihController');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

router.use(requireAuth);

/**
 * @swagger
 * tags:
 *   name: Tasbih
 *   description: Tasbih sessions and statistics
 */

/**
 * @swagger
 * /api/tasbih:
 *   post:
 *     summary: Log a tasbih session
 *     tags: [Tasbih]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - count
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [SubhanAllah, Alhamdulillah, AllahuAkbar, LaIlahaIllallah, Astaghfirullah, custom]
 *               customText:
 *                 type: string
 *               count:
 *                 type: integer
 *               targetCount:
 *                 type: integer
 *               date:
 *                 type: string
 *                 description: YYYY-MM-DD, defaults to today
 *     responses:
 *       201:
 *         description: Session logged
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TasbihSession'
 */
router.post('/', addTasbihSession);

/**
 * @swagger
 * /api/tasbih:
 *   get:
 *     summary: Get all tasbih sessions (recent first)
 *     tags: [Tasbih]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of sessions
 */
router.get('/', getAllTasbihSessions);

/**
 * @swagger
 * /api/tasbih/date/{date}:
 *   get:
 *     summary: Get tasbih sessions for a specific date
 *     tags: [Tasbih]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sessions and totals for the date
 */
router.get('/date/:date', getTasbihSessionsByDate);

/**
 * @swagger
 * /api/tasbih/stats:
 *   get:
 *     summary: Get tasbih statistics
 *     tags: [Tasbih]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stats by type and overall
 */
router.get('/stats', getTasbihStats);

/**
 * @swagger
 * /api/tasbih/today:
 *   get:
 *     summary: Get today's tasbih total
 *     tags: [Tasbih]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Today's count breakdown
 */
router.get('/today', getTodayTotal);

module.exports = router;
