const express = require('express');
const {
    logQuranActivity,
    getQuranActivitiesByDate,
    getAllQuranActivities,
    getQuranProgress,
    getSurahProgress,
    toggleBookmark,
    toggleMemorized,
    updateSurahNotes,
    getBookmarkedSurahs,
    markAsRead,
    getReadSurahs
} = require('../controllers/quranController');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

router.use(requireAuth);

/**
 * @swagger
 * tags:
 *   name: Quran
 *   description: Quran reading activities and progress
 */

/**
 * @swagger
 * /api/quran/activity:
 *   post:
 *     summary: Log a Quran reading activity
 *     tags: [Quran]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - surahNumber
 *               - surahName
 *             properties:
 *               surahNumber:
 *                 type: integer
 *               surahName:
 *                 type: string
 *               startAyah:
 *                 type: integer
 *               endAyah:
 *                 type: integer
 *               duration:
 *                 type: integer
 *                 description: Minutes spent
 *               date:
 *                 type: string
 *                 description: YYYY-MM-DD, defaults to today
 *     responses:
 *       201:
 *         description: Activity logged successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QuranActivity'
 */
router.post('/activity', logQuranActivity);

/**
 * @swagger
 * /api/quran/activity:
 *   get:
 *     summary: Get all Quran activities (recent first)
 *     tags: [Quran]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Max number of activities to return
 *     responses:
 *       200:
 *         description: List of activities
 */
router.get('/activity', getAllQuranActivities);

/**
 * @swagger
 * /api/quran/activity/{date}:
 *   get:
 *     summary: Get Quran activities for a specific date
 *     tags: [Quran]
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
 *         description: Activities for the date
 */
router.get('/activity/:date', getQuranActivitiesByDate);

/**
 * @swagger
 * /api/quran/progress:
 *   get:
 *     summary: Get all surah progress
 *     tags: [Quran]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Progress for all surahs
 */
router.get('/progress', getQuranProgress);

/**
 * @swagger
 * /api/quran/progress/{surahNumber}:
 *   get:
 *     summary: Get progress for a specific surah
 *     tags: [Quran]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: surahNumber
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Surah progress
 */
router.get('/progress/:surahNumber', getSurahProgress);

/**
 * @swagger
 * /api/quran/bookmark/{surahNumber}:
 *   put:
 *     summary: Toggle bookmark for a surah
 *     tags: [Quran]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: surahNumber
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               surahName:
 *                 type: string
 *               totalAyahs:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Updated surah progress
 */
router.put('/bookmark/:surahNumber', toggleBookmark);

/**
 * @swagger
 * /api/quran/memorized/{surahNumber}:
 *   put:
 *     summary: Toggle memorized status for a surah
 *     tags: [Quran]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: surahNumber
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Updated surah progress
 */
router.put('/memorized/:surahNumber', toggleMemorized);

/**
 * @swagger
 * /api/quran/notes/{surahNumber}:
 *   put:
 *     summary: Update notes for a surah
 *     tags: [Quran]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: surahNumber
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated surah progress
 */
router.put('/notes/:surahNumber', updateSurahNotes);

/**
 * @swagger
 * /api/quran/bookmarks:
 *   get:
 *     summary: Get all bookmarked surahs
 *     tags: [Quran]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of bookmarked surahs
 */
router.get('/bookmarks', getBookmarkedSurahs);

/**
 * @swagger
 * /api/quran/read/{surahNumber}:
 *   put:
 *     summary: Mark a surah as read (increments read count)
 *     tags: [Quran]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: surahNumber
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               surahName:
 *                 type: string
 *               totalAyahs:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Updated surah progress with incremented completedReads
 */
router.put('/read/:surahNumber', markAsRead);

/**
 * @swagger
 * /api/quran/read:
 *   get:
 *     summary: Get all surahs that have been read
 *     tags: [Quran]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of read surahs
 */
router.get('/read', getReadSurahs);

module.exports = router;
