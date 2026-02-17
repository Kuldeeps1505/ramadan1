const healthCheck = (req, res) => {
  res.status(200).json({
    message: 'Server is healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  healthCheck,
};
