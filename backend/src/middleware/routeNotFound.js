const routeNotFound = (req, res, next) => {
  res.status(404).json({ message: 'Not Found' });
};

module.exports = routeNotFound;
