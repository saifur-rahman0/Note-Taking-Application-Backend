const express = require('express');
const { body } = require('express-validator');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getAllNotes,
  getUsersGroupedByInterests,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roles');

const router = express.Router();

// All admin routes require JWT + admin role
router.use(protect);
router.use(authorizeRoles('admin'));

// Validation rules for creating a user
const createUserValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['user', 'admin']).withMessage('Role must be user or admin'),
];

// ── User management routes                  ─
// IMPORTANT: /users/grouped-by-interests must come BEFORE /users/:id
// otherwise Express will match "grouped-by-interests" as the :id param
router.get('/users/grouped-by-interests', getUsersGroupedByInterests);  // Aggregation Scenario 1
router.get('/users', getAllUsers);                                        // List all users
router.get('/users/:id', getUserById);                                    // Get single user
router.post('/users', createUserValidation, createUser);                 // Add user
router.put('/users/:id', updateUser);                                     // Update user
router.delete('/users/:id', deleteUser);                                  // Remove user

// ── Notes management routes                  
router.get('/notes', getAllNotes);                                         // View all notes

module.exports = router;
