const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(`${err.name || 'Error'}: ${err.message}`, err);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    error: {
      message: err.message || 'Something went wrong',
      type: err.name || 'InternalServerError',
    },
  });
};

module.exports = errorHandler;
