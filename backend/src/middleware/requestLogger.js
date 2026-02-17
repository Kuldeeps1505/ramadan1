const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
  logger.info(`Incoming request: ${req.method} ${req.originalUrl}`);
  next();
};

module.exports = requestLogger;
