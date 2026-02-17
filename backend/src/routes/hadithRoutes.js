const express = require('express');
const {
    logHadithActivity,
    getHadithActivitiesByDate,
    getAllHadithActivities,
    toggleLearned,
    toggleFavorite,
    getFavorites,
    getLearnedStats
} = require('../controllers/hadithController');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

router.use(requireAuth);

/**
 * @swagger
 * tags:
 *   name: Hadith
 *   description: Hadith reading activities and learning progress
 */

/**
 * @swagger
 * /api/hadith/activity:
 *   post:
 *     summary: Log a hadith read activity
 *     tags: [Hadith]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - collection
 *               - hadithNumber
 *             properties:
 *               collection:
 *                 type: string
 *                 enum: [bukhari, muslim, tirmidhi, abudawud, nasai, ibnmajah]
 *               hadithNumber:
 *                 type: integer
 *               hadithText:
 *                 type: string
 *               learned:
 *                 type: boolean
 *               favorited:
 *                 type: boolean
 *               date:
 *                 type: string
 *                 description: YYYY-MM-DD, defaults to today
 *     responses:
 *       201:
 *         description: Activity logged
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HadithActivity'
 */
router.post('/activity', logHadithActivity);

/**
 * @swagger
 * /api/hadith/activity:
 *   get:
 *     summary: Get all hadith activities (recent first)
 *     tags: [Hadith]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of activities
 */
router.get('/activity', getAllHadithActivities);

/**
 * @swagger
 * /api/hadith/activity/{date}:
 *   get:
 *     summary: Get hadith activities for a specific date
 *     tags: [Hadith]
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
 *         description: Activities for the date
 */
router.get('/activity/:date', getHadithActivitiesByDate);

/**
 * @swagger
 * /api/hadith/learned/{hadithCollection}/{hadithNumber}:
 *   put:
 *     summary: Toggle learned status for a hadith
 *     tags: [Hadith]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hadithCollection
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: hadithNumber
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Updated activity
 */
router.put('/learned/:hadithCollection/:hadithNumber', toggleLearned);

/**
 * @swagger
 * /api/hadith/favorite/{hadithCollection}/{hadithNumber}:
 *   put:
 *     summary: Toggle favorite status for a hadith
 *     tags: [Hadith]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hadithCollection
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: hadithNumber
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Updated activity
 */
router.put('/favorite/:hadithCollection/:hadithNumber', toggleFavorite);

/**
 * @swagger
 * /api/hadith/favorites:
 *   get:
 *     summary: Get all favorited hadiths
 *     tags: [Hadith]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of favorites
 */
router.get('/favorites', getFavorites);

/**
 * @swagger
 * /api/hadith/stats:
 *   get:
 *     summary: Get learned hadith stats by collection
 *     tags: [Hadith]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stats per collection
 */
router.get('/stats', getLearnedStats);

module.exports = router;
