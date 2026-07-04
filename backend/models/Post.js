const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A post must belong to a user'],
    },
    text: {
      type: String,
      required: [true, 'Post text cannot be empty'],
      maxlength: [500, 'Post text cannot exceed 500 characters'],
      trim: true,
    },
    image: {
      type: String,
      default: null,
    },
    // Array of user IDs who have liked this post
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

/**
 * =========================================================================
 * MONGOOSE INDEXING STRATEGY
 * =========================================================================
 * 
 * 1. user: 1 (Single Field Index)
 *    Optimizes fetching posts authored by a single user (e.g. Profile Page)
 *    and fetching feeds where we filter by an array of users (e.g. using $in).
 * 
 * 2. createdAt: -1 (Single Field Index / Compound Part)
 *    Since posts are almost always fetched and displayed in reverse-chronological 
 *    order (newest first), sorting by createdAt descending requires an index to 
 *    avoid performing an expensive in-memory sort.
 */
PostSchema.index({ user: 1 });
PostSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Post', PostSchema);
