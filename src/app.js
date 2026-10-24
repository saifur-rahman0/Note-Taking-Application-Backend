const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Route imports
const authRoutes = require('./routes/auth');
const noteRoutes = require('./routes/notes');
const adminRoutes = require('./routes/admin');
const postRoutes = require('./routes/posts');

const app = express();

//   Middleware                      
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const connectDB = require('./config/db');

// Ensure database connection on each request (crucial for serverless Vercel execution)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection error in request:', err);
    res.status(500).json({ success: false, message: 'Database connection error. Please try again.' });
  }
});

//   API Routes                      
app.use('/api/auth', authRoutes);          // Auth: register, login, me
app.use('/api/notes', noteRoutes);         // Notes: user CRUD
app.use('/api/admin', adminRoutes);        // Admin: user management, all notes, aggregation 1
app.use('/api/posts', postRoutes);         // Posts: public list, create, aggregation 2 ($lookup)

//   Default Root & /api Handler
app.get(['/', '/api'], (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Secure Note-Taking Application Backend API is running successfully.',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth (register, login, me)',
      notes: '/api/notes (CRUD user notes)',
      admin: '/api/admin (user management, all notes, interests aggregation)',
      posts: '/api/posts (public posts, $lookup user aggregation)'
    }
  });
});

//   Health Check             
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'API is running.', timestamp: new Date() });
});

//   404 Handler        
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

//   Global Error Handler   
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error.',
  });
});

module.exports = app;
