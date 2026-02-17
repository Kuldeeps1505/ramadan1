const mongoose = require('mongoose');
const User = require('../models/userModel');
const logger = require('../utils/logger');

const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('email role name picture createdAt')
      .sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: 'Invalid user ID' });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted successfully', user });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!['user', 'admin'].includes(role)) {
      return res
        .status(400)
        .json({ error: 'Role must be either user or admin' });
    }

    const user = await User.signup(email, password, role);
    res.status(201).json({
      message: 'User created successfully',
      user: {
        email: user.email,
        role: user.role,
        name: user.name,
        picture: user.picture,
      },
    });
  } catch (error) {
    logger.error(error);
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  getUsers,
  deleteUser,
  createUser,
};
