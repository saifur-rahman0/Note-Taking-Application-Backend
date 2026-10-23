const express = require('express');
const { body } = require('express-validator');
const { getAllPosts, createPost, getUserPostsAggregation } = require('../controllers/postController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const postValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('body').trim().notEmpty().withMessage('Body is required'),
];

// Routes
router.get('/', getAllPosts);                                         // GET /api/posts          — all posts (public)
router.post('/', protect, postValidation, createPost);               // POST /api/posts         — create post (auth required)
router.get('/user/:userId', getUserPostsAggregation);                // GET /api/posts/user/:id — Aggregation Scenario 2 ($lookup)

module.exports = router;
