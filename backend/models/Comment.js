const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A comment must belong to a user'],
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: [true, 'A comment must belong to a post'],
    },
    text: {
      type: String,
      required: [true, 'Comment text cannot be empty'],
      maxlength: [300, 'Comment text cannot exceed 300 characters'],
      trim: true,
    },
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
 * 1. post: 1 (Single Field Index)
 *    When rendering a post's detail view or feed, we often query comments
 *    associated with that post (Comment.find({ post: postId })). Adding an index
 *    on the post field ensures we scan only matching comments rather than the
 *    entire database collection.
 */
CommentSchema.index({ post: 1 });

module.exports = mongoose.model('Comment', CommentSchema);
