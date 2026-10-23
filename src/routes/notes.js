const express = require('express');
const { body } = require('express-validator');
const {
  getMyNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
} = require('../controllers/noteController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All note routes require authentication
router.use(protect);

// Validation rules
const noteValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('content').trim().notEmpty().withMessage('Content is required'),
];

// Routes
router.get('/', getMyNotes);                     // GET /api/notes         — user's own notes
router.get('/:id', getNoteById);                 // GET /api/notes/:id     — single note
router.post('/', noteValidation, createNote);    // POST /api/notes        — create note
router.put('/:id', noteValidation, updateNote);  // PUT /api/notes/:id     — update note
router.delete('/:id', deleteNote);               // DELETE /api/notes/:id  — delete note

module.exports = router;
