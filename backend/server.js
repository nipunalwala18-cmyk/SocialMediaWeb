require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const passport = require('passport');

const connectDB = require('./config/db');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');

// 1. Establish Database Connection
connectDB();

const app = express();

// 2. Security Middleware Configurations
// Helmet sets HTTP headers for securing the Express app against common exploits
app.use(helmet());

// Enable Cross-Origin Resource Sharing for all origins (or configure as needed)
app.use(cors());

// Express Rate Limiting to prevent brute-force attacks and DDoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after 15 minutes',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// 3. Body Parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Initialize Passport Authentication Middlewares
app.use(passport.initialize());

// Load Passport strategy configuration files
require('./config/passport');
require('./config/passport-jwt');

// 5. Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api', commentRoutes); // Mounts `/posts/:postId/comments` and `/comments/:id` on `/api`

// Basic landing route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Social Media API. Navigate to /api/auth, /api/users, /api/posts to interact.',
  });
});

// 6. Global Error Handling Middleware
// Captures schema validation errors, duplicate MongoDB records, and syntax errors, returning clean JSON.
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error Log:', err);

  // Syntax error (e.g. malformed JSON sent in request body)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'Malformed JSON payload in request body',
    });
  }

  // MongoDB duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      error: `Duplicate field error: ${field} already exists`,
    });
  }

  // Mongoose schema validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      success: false,
      error: 'Database Validation Failed',
      details: messages,
    });
  }

  // Generic internal server error
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
