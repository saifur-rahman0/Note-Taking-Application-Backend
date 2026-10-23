const { validationResult } = require('express-validator');
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

// @desc    Get logged-in user's notes (paginated)
// @route   GET /api/notes
// @access  Private (user, admin)
// Uses index: { owner: 1, createdAt: -1 }
const getMyNotes = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);

    const [notes, total] = await Promise.all([
      Note.find({ owner: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Note.countDocuments({ owner: req.user._id }),
    ]);

    res.status(200).json({
      success: true,
      data: notes,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('getMyNotes error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Get a single note by ID (owner only)
// @route   GET /api/notes/:id
// @access  Private (user, admin)
// Uses default _id index (MongoDB auto-creates unique index on _id)
const getNoteById = async (req, res) => {
  try {
    const query =
      req.user.role === 'admin'
        ? { _id: req.params.id }
        : { _id: req.params.id, owner: req.user._id };

    const note = await Note.findOne(query).populate('owner', 'name email').lean();

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found or access denied.' });
    }

    res.status(200).json({ success: true, data: note });
  } catch (error) {
    console.error('getNoteById error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Create a new note
// @route   POST /api/notes
// @access  Private (user, admin)
const createNote = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { title, content } = req.body;
    const note = await Note.create({ title, content, owner: req.user._id });

    res.status(201).json({ success: true, message: 'Note created.', data: note });
  } catch (error) {
    console.error('createNote error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Update own note
// @route   PUT /api/notes/:id
// @access  Private (user, admin)
const updateNote = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const query =
      req.user.role === 'admin'
        ? { _id: req.params.id }
        : { _id: req.params.id, owner: req.user._id };

    const note = await Note.findOneAndUpdate(
      query,
      { title: req.body.title, content: req.body.content },
      { new: true, runValidators: true }
    );

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found or access denied.' });
    }

    res.status(200).json({ success: true, message: 'Note updated.', data: note });
  } catch (error) {
    console.error('updateNote error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Delete own note
// @route   DELETE /api/notes/:id
// @access  Private (user, admin)
const deleteNote = async (req, res) => {
  try {
    const query =
      req.user.role === 'admin'
        ? { _id: req.params.id }
        : { _id: req.params.id, owner: req.user._id };

    const note = await Note.findOneAndDelete(query);

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found or access denied.' });
    }

    res.status(200).json({ success: true, message: 'Note deleted successfully.' });
  } catch (error) {
    console.error('deleteNote error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getMyNotes, getNoteById, createNote, updateNote, deleteNote };
