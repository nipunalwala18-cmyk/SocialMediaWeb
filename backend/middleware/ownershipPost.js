const Post = require('../models/Post');

/**
 * Middleware to check if the authenticated user is the owner of the post.
 * Prevents unauthorized modifications (PUT/DELETE) of other users' posts.
 * 
 * - If post does not exist: Returns 404 Not Found.
 * - If user is not the owner: Returns 403 Forbidden (authenticated but unauthorized).
 * - If user is the owner: Attaches the post object to req.post and proceeds to next().
 */
const ownershipPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    // Compare post creator's ID with logged-in user's ID
    if (post.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You do not own this post',
      });
    }

    // Attach post to req object to save an extra database query in the controller
    req.post = post;
    next();
  } catch (error) {
    console.error('Ownership Post check error:', error.message);
    
    // CastError occurs when req.params.id is not a valid MongoDB ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid post ID format',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Server error during ownership validation',
    });
  }
};

module.exports = ownershipPost;
