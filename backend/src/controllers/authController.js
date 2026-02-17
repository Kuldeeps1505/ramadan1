const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const validator = require('validator');
const { OAuth2Client } = require('google-auth-library');
const appleSignin = require('apple-signin-auth');

const User = require('../models/userModel');
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require('../utils/mailer');

const config = require('../config/env');

const secret = config.jwt.secret;
const APP_BASE_URL = config.urls.appBase;
const googleClient = new OAuth2Client(config.auth.googleClientId);

const createToken = (user) =>
  jwt.sign({ _id: user._id, role: user.role }, secret, { expiresIn: '3d' });

// Login for all roles
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.login(email, password);
    const token = createToken(user);
    res.status(200).json({
      email: user.email,
      role: user.role,
      name: user.name,
      picture: user.picture,
      token,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// SignUp for all roles
const signUp = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.signup(email, password);

    const rawToken = user.issueEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    await sendVerificationEmail(user.email, rawToken);

    res.status(200).json({
      message:
        'Signup successful. Please check your email to verify your account.',
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Made for Admins to create new admins
const signUpAdmin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.signup(email, password, 'admin');
    user.isVerified = true;
    user.verificationTokenHash = null;
    user.verificationTokenExpires = null;
    await user.save({ validateBeforeSave: false });

    const token = createToken(user);
    res.status(200).json({
      email: user.email,
      role: user.role,
      name: user.name,
      picture: user.picture,
      token,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Verify email
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.redirect(`${APP_BASE_URL}/verify-error`);

    const hash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      verificationTokenHash: hash,
      verificationTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.redirect(`${APP_BASE_URL}/verify-error`);
    }

    user.isVerified = true;
    user.verificationTokenHash = null;
    user.verificationTokenExpires = null;
    await user.save({ validateBeforeSave: false });

    return res.redirect(`${APP_BASE_URL}/verify-success`);
  } catch (error) {
    return res.redirect(`${APP_BASE_URL}/verify-error`);
  }
};

// Resend verification email
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const normalized = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalized });

    if (!user) {
      return res.status(200).json({
        message: 'If the email exists, a verification link has been sent.',
      });
    }

    if (user.isVerified) {
      return res
        .status(200)
        .json({ message: 'Email already verified. Please log in.' });
    }

    const rawToken = user.issueEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    await sendVerificationEmail(user.email, rawToken);

    res.status(200).json({ message: 'Verification email sent.' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (email) {
      const normalized = String(email).trim().toLowerCase();
      const user = await User.findOne({ email: normalized });

      if (user) {
        const rawToken = user.issuePasswordResetToken();
        await user.save({ validateBeforeSave: false });
        await sendPasswordResetEmail(user.email, rawToken);
      }
    }

    return res.status(200).json({
      message: 'If the email exists, a reset link has been sent.',
    });
  } catch (_err) {
    return res.status(200).json({
      message: 'If the email exists, a reset link has been sent.',
    });
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res
        .status(400)
        .json({ error: 'Token and new password are required.' });
    }

    if (!validator.isStrongPassword(password)) {
      return res.status(400).json({ error: 'Password is not strong enough.' });
    }

    const hash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordTokenHash: hash,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired token.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    user.clearPasswordResetData();
    if (!user.isVerified) user.isVerified = true;

    await user.save();

    return res
      .status(200)
      .json({ message: 'Password updated successfully. You can log in now.' });
  } catch (_err) {
    return res.status(500).json({ error: 'Could not reset password.' });
  }
};

// POST /api/auth/google
const googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: 'idToken is required' });

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: config.auth.googleClientId,
    });
    const payload = ticket.getPayload();

    const email = String(payload?.email || '').toLowerCase();
    const emailVerified = !!payload?.email_verified;
    const googleSub = payload?.sub;
    if (!email || !emailVerified || !googleSub) {
      return res
        .status(401)
        .json({ error: 'Google account not verified or invalid payload' });
    }

    let user = await User.findOne({ email });

    if (!user) {
      const random = crypto.randomBytes(32).toString('hex') + 'Aa1!';
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(random, salt);

      user = await User.create({
        email,
        password: hash,
        role: 'user',
        isVerified: true,
        provider: 'google',
        googleId: googleSub,
        name: payload.name,
        picture: payload.picture,
      });
    } else {
      let changed = false;
      if (!user.isVerified) {
        user.isVerified = true;
        changed = true;
      }
      if (!user.googleId) {
        user.googleId = googleSub;
        changed = true;
      }
      if (!user.provider) {
        user.provider = 'google';
        changed = true;
      }
      if (!user.name && payload.name) {
        user.name = payload.name;
        changed = true;
      }
      if (!user.picture && payload.picture) {
        user.picture = payload.picture;
        changed = true;
      }

      if (changed) await user.save({ validateBeforeSave: false });
    }

    const token = createToken(user);
    return res.status(200).json({
      email: user.email,
      role: user.role,
      name: user.name,
      picture: user.picture,
      token,
    });
  } catch (_err) {
    return res.status(401).json({ error: 'Invalid Google token' });
  }
};

// POST /api/auth/apple
const appleAuth = async (req, res) => {
  try {
    const { identityToken } = req.body;
    if (!identityToken) return res.status(400).json({ error: 'identityToken is required' });

    const { sub: appleSub, email: appleEmail } = await appleSignin.verifyIdToken(identityToken, {
      // apple-signin-auth verifies audience by default if passed
      audience: config.auth.appleClientId,
      ignoreExpiration: false,
    });

    const email = String(appleEmail || '').toLowerCase();
    // Apple doesn't always return email, only on first sign in. So we might need to rely on appleSub to find user.

    // Logic:
    // 1. Try to find user by appleId
    // 2. If not found, try to find by email (if email present)
    // 3. If found, link appleId
    // 4. If not found, create new user

    let user = await User.findOne({ appleId: appleSub });

    if (!user && email) {
      user = await User.findOne({ email });
    }

    if (!user) {
      // Create new user
      const random = crypto.randomBytes(32).toString('hex') + 'Aa1!';
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(random, salt);

      // Note: Apple may not provide name in id_token, it comes in a separate 'user' JSON object on first response
      // For this simple implementation, if name is missing, we leave it blank or use email

      user = await User.create({
        email: email || `${appleSub}@apple.id`, // Fallback if email is hidden
        password: hash,
        role: 'user',
        isVerified: true,
        provider: 'apple',
        appleId: appleSub,
        name: '', // We might want to pass name from frontend if available
        picture: '',
      });
    } else {
      // Update existing user
      let changed = false;
      if (!user.isVerified) {
        user.isVerified = true;
        changed = true;
      }
      if (!user.appleId) {
        user.appleId = appleSub;
        changed = true;
      }
      if (user.provider === 'local') {
        // Keep local but allow apple login? Or switch?
        // The other logic switches provider. Let's stick to that pattern.
        // user.provider = 'apple'; 
        // Actually google logic only switches if !user.provider. 
      }

      if (changed) await user.save({ validateBeforeSave: false });
    }

    const token = createToken(user);
    return res.status(200).json({
      email: user.email,
      role: user.role,
      name: user.name,
      picture: user.picture,
      token,
    });

  } catch (err) {
    console.error('Apple Auth Error:', err);
    return res.status(401).json({ error: 'Invalid Apple token' });
  }
};

// GET /api/auth/me  
const me = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      'email role name picture provider isVerified createdAt updatedAt'
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.status(200).json(user);
  } catch (_err) {
    return res.status(500).json({ error: 'Could not fetch user profile' });
  }
};

module.exports = {
  signUp,
  login,
  signUpAdmin,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  googleAuth,
  appleAuth,
  me,
};
