const mongoose = require('mongoose');

const app = require('./src/app');
const config = require('./src/config/env');
const logger = require('./src/utils/logger');

const PORT = config.port;
const URI = config.mongo.uri;
const DB_NAME = config.mongo.dbName;

// DEBUG: Print the actual MongoDB URI being used
console.log('DEBUG MONGO_URI:', URI);
console.log('DEBUG process.env.MONGO_URI:', process.env.MONGO_URI);

/**
 * ======================
 * GLOBAL NODE SAFETY NETS
 * ======================
 */
process.on('unhandledRejection', err => {
  logger.error('UNHANDLED REJECTION', err);
});

process.on('uncaughtException', err => {
  logger.error('UNCAUGHT EXCEPTION', err);
  process.exit(1);
});

/**
 * ======================
 * MONGOOSE CONNECTION
 * ======================
 */
mongoose.connection.on('connected', () => {
  logger.info('MongoDB connected');
});

mongoose.connection.on('reconnected', () => {
  logger.warn('MongoDB reconnected');
});

mongoose.connection.on('disconnected', () => {
  logger.error('MongoDB disconnected');
});

mongoose.connection.on('error', err => {
  logger.error('MongoDB error', err);
});

const connectWithRetry = () => {
  mongoose
    .connect(URI, {
      autoIndex: false,
      serverSelectionTimeoutMS: 20000,
      connectTimeoutMS: 20000,
      ...(DB_NAME && { dbName: DB_NAME }),
    })
    .then(() => {
      logger.info('MongoDB connected');
      app.listen(PORT, '0.0.0.0', () => {
        logger.info(`Server running on port ${PORT}`);
      });
    })
    .catch(err => {
      logger.error('MongoDB connection failed, retrying in 5s...', err.message);
      setTimeout(connectWithRetry, 5000);
    });
};

connectWithRetry();


/**
 * ======================
 * GRACEFUL SHUTDOWN
 * ======================
 */
const shutdown = async signal => {
  logger.warn(`Received ${signal}. Shutting down gracefully...`);

  try {
    await mongoose.connection.close(false);
    logger.info('MongoDB connection closed');
  } catch (err) {
    logger.error('Error during Mongo shutdown', err);
  }

  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);