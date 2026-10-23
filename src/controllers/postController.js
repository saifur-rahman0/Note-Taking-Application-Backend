const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const Post = require('../models/Post');
const User = require('../models/User');

/**
 * Helper: parse pagination params from query string
 */
const getPagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// @desc    Get all posts (public, paginated)
// @route   GET /api/posts
// @access  Public
// Uses index: { createdAt: -1 }
const getAllPosts = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);

    const [posts, total] = await Promise.all([
      Post.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'name email')
        .lean(),
      Post.countDocuments({}),
    ]);

    res.status(200).json({
      success: true,
      data: posts,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('getAllPosts error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Create a post
// @route   POST /api/posts
// @access  Private (user, admin)
const createPost = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { title, body } = req.body;
    const post = await Post.create({ title, body, author: req.user._id });

    res.status(201).json({ success: true, message: 'Post created.', data: post });
  } catch (error) {
    console.error('createPost error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};


// @desc    AGGREGATION SCENARIO 2 — Get all posts for a specific user via $lookup
// @route   GET /api/posts/user/:userId
// @access  Public
// Constraint: single aggregation pipeline with a $lookup stage
// Uses index: { author: 1, createdAt: -1 } on posts collection
const getUserPostsAggregation = async (req, res) => {
  try {
    const { userId } = req.params;
    const identifier = decodeURIComponent(userId).trim();

    // Support both 24-char ObjectId and email address
    let matchQuery;
    if (mongoose.Types.ObjectId.isValid(identifier) && /^[0-9a-fA-F]{24}$/.test(identifier)) {
      matchQuery = { _id: new mongoose.Types.ObjectId(identifier) };
    } else if (identifier.includes('@')) {
      // Uses the unique index: { email: 1 } on the User collection
      matchQuery = { email: identifier.toLowerCase() };
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid user identifier. Please provide a 24-character User ID or a valid email address.',
      });
    }

    const { page, limit, skip } = getPagination(req.query);

    // SINGLE aggregation pipeline with a $lookup stage
    // Starts from the User collection, joins Posts via $lookup
    const result = await User.aggregate([
      // Stage 1: Match the specific user by _id or email
      { $match: matchQuery },

      // Stage 2: $lookup — join posts using let and sub-pipeline
      // Uses the { author: 1, createdAt: -1 } index on the posts collection
      {
        $lookup: {
          from: 'posts',
          let: { uid: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$author', '$$uid'] },
              },
            },
            { $sort: { createdAt: -1 } },
            {
              $facet: {
                paginated: [
                  { $skip: skip },
                  { $limit: limit },
                  {
                    $project: {
                      title: 1,
                      body: 1,
                      createdAt: 1,
                      updatedAt: 1,
                    },
                  },
                ],
                total: [{ $count: 'count' }],
              },
            },
          ],
          as: 'postsData',
        },
      },

      // Stage 3: Extract and project fields
      {
        $project: {
          name: 1,
          email: 1,
          role: 1,
          interests: 1,
          stat: { $arrayElemAt: ['$postsData', 0] },
        },
      },
      {
        $project: {
          name: 1,
          email: 1,
          role: 1,
          interests: 1,
          posts: { $ifNull: ['$stat.paginated', []] },
          totalPosts: { $ifNull: [{ $arrayElemAt: ['$stat.total.count', 0] }, 0] },
        },
      },
    ]);

    if (!result || result.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const userData = result[0];
    const totalPosts = userData.totalPosts || 0;

    res.status(200).json({
      success: true,
      message: 'User posts retrieved via $lookup aggregation.',
      user: {
        id: userData._id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        interests: userData.interests,
      },
      data: userData.posts,
      pagination: {
        total: totalPosts,
        page,
        limit,
        totalPages: Math.ceil(totalPosts / limit),
      },
    });
  } catch (error) {
    console.error('getUserPostsAggregation error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getAllPosts, createPost, getUserPostsAggregation };
