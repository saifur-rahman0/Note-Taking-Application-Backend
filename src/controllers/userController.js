const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const Note = require('../models/Note');

/**
 * Helper: parse pagination params from query string
 */
const getPagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

 
// @desc    Get all users (paginated)
// @route   GET /api/admin/users
// @access  Private (admin only)
// Uses index: { createdAt: -1 }
 
const getAllUsers = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};

    const [users, total] = await Promise.all([
      User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: users,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('getAllUsers error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

 
// @desc    Get single user by ID
// @route   GET /api/admin/users/:id
// @access  Private (admin only)
// Uses default _id index
 
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('getUserById error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

 
// @desc    Admin creates a new user (can assign any role)
// @route   POST /api/admin/users
// @access  Private (admin only)
 
const createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password, role, interests } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    let parsedInterests = [];
    if (interests) {
      if (Array.isArray(interests)) {
        parsedInterests = interests.map((i) => i.trim()).filter(Boolean);
      } else if (typeof interests === 'string') {
        parsedInterests = interests.split(',').map((i) => i.trim()).filter(Boolean);
      }
    }

    const user = await User.create({ name, email, password, role: role || 'user', interests: parsedInterests });

    res.status(201).json({
      success: true,
      message: 'User created successfully.',
      data: { id: user._id, name: user.name, email: user.email, role: user.role, interests: user.interests },
    });
  } catch (error) {
    console.error('createUser error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

 
// @desc    Admin updates any user
// @route   PUT /api/admin/users/:id
// @access  Private (admin only)
 
const updateUser = async (req, res) => {
  try {
    const { name, email, role, interests } = req.body;

    const updateFields = {};
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (role) updateFields.role = role;
    if (interests) {
      if (Array.isArray(interests)) {
        updateFields.interests = interests.map((i) => i.trim()).filter(Boolean);
      } else if (typeof interests === 'string') {
        updateFields.interests = interests.split(',').map((i) => i.trim()).filter(Boolean);
      }
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({ success: true, message: 'User updated.', data: user });
  } catch (error) {
    console.error('updateUser error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

 
// @desc    Admin deletes a user
// @route   DELETE /api/admin/users/:id
// @access  Private (admin only)
 
const deleteUser = async (req, res) => {
  try {
    // Prevent self-deletion
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Also delete all notes belonging to the deleted user
    await Note.deleteMany({ owner: req.params.id });

    res.status(200).json({ success: true, message: 'User and their notes deleted successfully.' });
  } catch (error) {
    console.error('deleteUser error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

 
// @desc    Admin views ALL notes (paginated)
// @route   GET /api/admin/notes
// @access  Private (admin only)
// Uses index: { createdAt: -1 }
 
const getAllNotes = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);

    const [notes, total] = await Promise.all([
      Note.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('owner', 'name email')
        .lean(),
      Note.countDocuments({}),
    ]);

    res.status(200).json({
      success: true,
      data: notes,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('getAllNotes error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

 
// @desc    AGGREGATION SCENARIO 1 — Group users by interests
// @route   GET /api/admin/users/grouped-by-interests
// @access  Private (admin only)
// Constraint: uses exactly ONE collection.aggregate() call
// Uses index: { interests: 1 }
 
const getUsersGroupedByInterests = async (req, res) => {
  try {
    // EXACTLY ONE aggregate() call on the User collection
    const result = await User.aggregate([
      // Stage 1: Exclude users with no interests
      { $match: { interests: { $exists: true, $ne: [] } } },

      // Stage 2: Deconstruct the interests array so each element becomes a document
      { $unwind: '$interests' },

      // Stage 3: Group by each interest and collect user info
      {
        $group: {
          _id: '$interests',
          users: {
            $push: {
              id: '$_id',
              name: '$name',
              email: '$email',
              role: '$role',
            },
          },
          count: { $sum: 1 },
        },
      },

      // Stage 4: Rename _id to interest for clarity
      {
        $project: {
          _id: 0,
          interest: '$_id',
          users: 1,
          count: 1,
        },
      },

      // Stage 5: Sort by most popular interest first
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({
      success: true,
      message: 'Users grouped by interests.',
      data: result,
    });
  } catch (error) {
    console.error('getUsersGroupedByInterests error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getAllNotes,
  getUsersGroupedByInterests,
};
