const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true, // Creates a unique index on email
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    password: {
      type: String,
      // Nullable for Google OAuth users, but required for local registration
      default: null,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // CRITICAL: Allows multiple users to have 'null' or 'undefined' googleId without triggering duplicate key errors.
    },
    avatar: {
      type: String,
      default: 'https://ui-avatars.com/api/?name=User&background=random',
    },
    // Self-referential relationship (Many-to-Many):
    // Storing followers and following as arrays of User ObjectIds.
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt fields
  }
);

/**
 * =========================================================================
 * MONGOOSE INDEXING STRATEGY
 * =========================================================================
 * 
 * 1. Email Index: Handled by 'unique: true' in email field. Optimizes login and 
 *    registration queries checking if an email is already taken.
 * 
 * 2. Google ID Index: Handled by 'unique: true, sparse: true'. Since Google ID is 
 *    only present for Google authenticated users, the sparse index ensures that
 *    users without googleId (local logins) do not conflict.
 * 
 * 3. Followers & Following Array Indexes:
 *    Since users will frequently view their following list or fetch posts from 
 *    users they follow, we index these arrays for quick lookups.
 */
UserSchema.index({ followers: 1 });
UserSchema.index({ following: 1 });

module.exports = mongoose.model('User', UserSchema);
