const Comment = require('../models/Comment');

/**
 * Middleware to check if the authenticated user is the owner of the comment.
 * Ensures that users can only delete their own comments.
 * 
 * - If comment does not exist: Returns 404 Not Found.
 * - If user is not the owner: Returns 403 Forbidden.
 * - If user is the owner: Attaches comment to req.comment and proceeds to next().
 */
const ownershipComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found',
      });
    }

    // Compare comment creator's ID with logged-in user's ID
    if (comment.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You do not own this comment',
      });
    }

    // Attach comment to request object to optimize database reads in the controller
    req.comment = comment;
    next();
  } catch (error) {
    console.error('Ownership Comment check error:', error.message);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid comment ID format',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Server error during ownership validation',
    });
  }
};

module.exports = ownershipComment;
