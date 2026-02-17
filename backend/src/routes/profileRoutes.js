const express = require('express');
const {
    getProfile,
    updateProfile,
    getGoals,
    updateGoals,
    getBlessingTracker,
    updateBlessingTracker
} = require('../controllers/profileController');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

router.use(requireAuth);

/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Get current user's profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Profile'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 *       500:
 *         description: Server error
 *   put:
 *     summary: Update or create current user's profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Profile'
 *     responses:
 *       200:
 *         description: Updated profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Profile'
 *       400:
 *         description: Bad request (Invalid input)
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 * 
 * /profile/goals:
 *   get:
 *     summary: Get user's goals
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User goals
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GoalConfig'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Goals not found
 *       500:
 *         description: Server error
 *   put:
 *     summary: Update user's goals
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GoalConfig'
 *     responses:
 *       200:
 *         description: Updated goals
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GoalConfig'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 * 
 * /profile/blessing-tracker:
 *   get:
 *     summary: Get user's blessing tracker
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User blessing tracker
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BlessingTracker'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Blessing tracker not found
 *       500:
 *         description: Server error
 *   put:
 *     summary: Update user's blessing tracker
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BlessingTracker'
 *     responses:
 *       200:
 *         description: Updated blessing tracker
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BlessingTracker'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

router.get('/', getProfile);
router.put('/', updateProfile);

// Goal Routes
router.get('/goals', getGoals);
router.put('/goals', updateGoals);

// Blessing Tracker Routes
router.get('/blessing-tracker', getBlessingTracker);
router.put('/blessing-tracker', updateBlessingTracker);

module.exports = router;
