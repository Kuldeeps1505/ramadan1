require('dotenv').config({ override: true });

const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 4000,
  trustProxy: Number(process.env.TRUST_PROXY) || 1,

  mongo: {
    uri: process.env.MONGO_URI,
    dbName: process.env.MONGO_DB_NAME,
  },

  cors: {
    origin: process.env.ORIGIN,
    allowedOrigins: process.env.ORIGIN ? process.env.ORIGIN.split(',').map(o => o.trim()) : [],
  },

  jwt: {
    secret: process.env.SECRET,
  },

  urls: {
    appBase: process.env.APP_BASE_URL || 'http://localhost:5173',
    apiBase: process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 4000}`,
  },

  auth: {
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    appleClientId: process.env.APPLE_CLIENT_ID,
    appleIosBundleId: process.env.APPLE_IOS_BUNDLE_ID,
  },

  email: {
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || '587',
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    from: process.env.EMAIL_FROM,
    appName: process.env.APP_NAME || 'Ramadan',
  },

  services: {
    sendgridApiKey: process.env.SENDGRID_API_KEY,
  },

  swagger: {
    serverUrl: process.env.SWAGGER_SERVER_URL || 'http://localhost:4000/api',
  },

  version: process.env.API_VERSION || '1.0.0',
};

const validateEnv = () => {
  const required = [
    'MONGO_URI',
    'SECRET',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    process.exit(1);
  }
};

validateEnv();

module.exports = config;