const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const {
  ValidationError,
  ConflictError,
  AuthenticationError,
} = require('../utils/error');


const Schema = mongoose.Schema;

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           format: password
 *           writeOnly: true
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           default: user
 *         name:
 *           type: string
 *         picture:
 *           type: string
 *         isVerified:
 *           type: boolean
 *         provider:
 *           type: string
 *           enum: [local, google, apple]
 *         googleId:
 *           type: string
 *         appleId:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 */


const displayNameFromEmail = (email) => {
  const local = String(email || '').split('@')[0] || '';
  if (!local) return String(email || '');
  const words = local
    .replace(/\d+/g, '')
    .split(/[._-]+/g)
    .filter(Boolean);
  const pretty =
    words.length > 0
      ? words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      : local.charAt(0).toUpperCase() + local.slice(1);
  return pretty;
};

const gravatarFromEmail = (email) => {
  const norm = String(email || '').trim().toLowerCase();
  const hash = crypto.createHash('md5').update(norm).digest('hex');
  return `https://www.gravatar.com/avatar/${hash}?d=identicon`;
};

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },

    // --- OAuth ---
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    appleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    provider: {
      type: String,
      enum: ['local', 'google', 'apple'],
      default: 'local',
    },
    name: { type: String },
    picture: { type: String },

    // --- Profile / Onboarding ---
    isOnboarded: {
      type: Boolean,
      default: false,
    },
    city: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    calculationMethod: {
      type: String,
      default: 'ISNA',
    },
    asrMethod: {
      type: String,
      default: 'Standard',
    },
    goalQuranMinutes: {
      type: Number,
      default: 30,
    },

    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },

    // Email verification
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationTokenHash: {
      type: String,
      default: null,
      select: true,
    },
    verificationTokenExpires: {
      type: Date,
      default: null,
    },

    // --- Password reset ---
    resetPasswordTokenHash: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Ensure name/picture are set if missing on any save/create
userSchema.pre('save', function (next) {
  if (!this.name && this.email) {
    this.name = displayNameFromEmail(this.email);
  }
  if (!this.picture && this.email) {
    this.picture = gravatarFromEmail(this.email);
  }
  next();
});

// ===== Email verification helpers =====
userSchema.methods.issueEmailVerificationToken = function () {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(rawToken).digest('hex');

  this.verificationTokenHash = hash;
  this.verificationTokenExpires = new Date(Date.now() + 1000 * 60 * 60 * 24);
  return rawToken;
};

userSchema.methods.clearVerificationData = function () {
  this.verificationTokenHash = null;
  this.verificationTokenExpires = null;
};

// ===== Password reset helpers  =====
userSchema.methods.issuePasswordResetToken = function () {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(rawToken).digest('hex');

  this.resetPasswordTokenHash = hash;
  this.resetPasswordExpires = new Date(Date.now() + 1000 * 60 * 60);
  return rawToken;
};

userSchema.methods.clearPasswordResetData = function () {
  this.resetPasswordTokenHash = null;
  this.resetPasswordExpires = null;
};

// ===== Auth statics =====
userSchema.statics.signup = async function (email, password, role = 'user') {
  if (!email || !password) {
    throw new ValidationError('All fields must be filled');
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  if (!validator.isEmail(normalizedEmail)) {
    throw new ValidationError('Email is not valid');
  }

  if (!validator.isStrongPassword(password)) {
    throw new ValidationError('Password is not strong enough');
  }

  if (!['user', 'admin'].includes(role)) {
    throw new ValidationError('Invalid role');
  }

  const exists = await this.findOne({ email: normalizedEmail });
  if (exists) {
    throw new ConflictError('Email already in use');
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  // Derive defaults
  const name = displayNameFromEmail(normalizedEmail);
  const picture = gravatarFromEmail(normalizedEmail);

  const user = await this.create({
    email: normalizedEmail,
    password: hash,
    role,
    isVerified: false,
    name,
    picture,
  });

  return user;
};

userSchema.statics.login = async function (email, password) {
  if (!email || !password) {
    throw new ValidationError('All fields must be filled');
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await this.findOne({ email: normalizedEmail });

  if (!user) {
    throw new AuthenticationError('Incorrect Email');
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw new AuthenticationError('Incorrect Password');
  }

  if (!user.isVerified) {
    throw new AuthenticationError('Email not verified. Please verify your email.');
  }

  return user;
};

module.exports = mongoose.model('User', userSchema);
