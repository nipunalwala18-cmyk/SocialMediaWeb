const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Helper function to generate a JSON Web Token (JWT)
 * Stores the user's MongoDB unique identifier (id) inside the payload.
 * Expires in 30 days.
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretkey', {
    expiresIn: '30d',
  });
};

/**
 * @desc    Register a new local user
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validate input fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please enter name, email, and password',
      });
    }

    // 2. Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        error: 'A user with this email already exists',
      });
    }

    // 3. Encrypt password using bcryptjs
    // Salt generation: 10 rounds of hashing is standard (balance between speed and security)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create new User record in MongoDB
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // 5. Generate and return a JWT
    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Registration error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Server error during registration',
    });
  }
};

/**
 * @desc    Authenticate local user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate inputs
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please enter email and password',
      });
    }

    // 2. Find user in database
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // 3. Prevent login if they register via Google OAuth and have no local password set
    if (!user.password) {
      return res.status(400).json({
        success: false,
        error: 'This account uses Google Login. Please sign in with Google.',
      });
    }

    // 4. Compare entered password with hashed password stored in DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // 5. Generate and return JWT
    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Server error during authentication',
    });
  }
};

/**
 * @desc    Get currently logged-in user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Get profile error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Server error retrieving profile',
    });
  }
};
