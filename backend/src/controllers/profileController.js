const Profile = require('../models/profileModel');
const { NotFoundError } = require('../utils/error');



// Get current user's profile
exports.getProfile = async (req, res, next) => {
    try {
        let profile = await Profile.findOne({ user: req.user._id });

        if (!profile) {
            // Return a default/empty profile strcture if not found, or Create one
            // For better UX, let's return a default structure or 404. 
            // Frontend expects a profile. Let's return 404 and let frontend handle creation/onboarding
            // OR, better yet, creating a default one here might save frontend logic. 
            // But given frontend has Onboarding flow, 404 might trigger it.
            // Let's stick to standard REST: 404 if not found.
            return res.status(200).json({
                isOnboarded: false,
                name: req.user.name, // Pre-fill name from User model
                user: req.user._id
            });
        }

        res.status(200).json(profile);
    } catch (error) {
        next(error);
    }
};

// Update or Create profile
exports.updateProfile = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const updates = req.body;

        // Remove user field from updates to prevent hijacking
        delete updates.user;

        const profile = await Profile.findOneAndUpdate(
            { user: userId },
            { $set: { ...updates, user: userId } }, // Ensure user is set
            { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
        );

        res.status(200).json(profile);
    } catch (error) {
        next(error);
    }
};

// Get user's goals
exports.getGoals = async (req, res, next) => {
    try {
        const profile = await Profile.findOne({ user: req.user._id });
        if (!profile) {
            return res.status(200).json({ quranTarget: 1, quranUnit: 'Juz' }); // Return default if no profile
        }
        res.status(200).json(profile.goals || { quranTarget: 1, quranUnit: 'Juz' });
    } catch (error) {
        next(error);
    }
};

// Update user's goals
exports.updateGoals = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const goalUpdates = req.body;

        const profile = await Profile.findOneAndUpdate(
            { user: userId },
            { $set: { goals: goalUpdates } },
            { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
        );

        res.status(200).json(profile.goals);
    } catch (error) {
        next(error);
    }
};

// Get blessing tracker
exports.getBlessingTracker = async (req, res, next) => {
    try {
        const profile = await Profile.findOne({ user: req.user._id });
        if (!profile) {
            return res.status(200).json({ lastDate: '', index: 0 }); // Default
        }
        res.status(200).json(profile.blessingTracker || { lastDate: '', index: 0 });
    } catch (error) {
        next(error);
    }
};

// Update blessing tracker
exports.updateBlessingTracker = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const trackerUpdates = req.body;

        const profile = await Profile.findOneAndUpdate(
            { user: userId },
            { $set: { blessingTracker: trackerUpdates } },
            { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
        );

        res.status(200).json(profile.blessingTracker);
    } catch (error) {
        next(error);
    }
};
