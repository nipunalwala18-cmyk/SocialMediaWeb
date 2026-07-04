const Comment = require('../models/Comment');
const Post = require('../models/Post');

/**
 * @desc    Add a comment to a post
 * @route   POST /api/posts/:postId/comments
 * @access  Private (Protected)
 */
exports.addComment = async (req, res) => {
  try {
    const postId = req.params.postId;
    const { text } = req.body;
    const userId = req.user.id;

    // 1. Validate request body
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Comment text is required',
      });
    }

    // 2. Check if the post actually exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found, cannot add comment',
      });
    }

    // 3. Create the comment
    const comment = new Comment({
      user: userId,
      post: postId,
      text,
    });

    await comment.save();

    // Populate user profile info to render name and avatar alongside comment immediately on UI
    const populatedComment = await comment.populate('user', 'name avatar');

    return res.status(201).json({
      success: true,
      data: populatedComment,
    });
  } catch (error) {
    console.error('Add comment error:', error.message);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid post ID format',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Server error while adding comment',
    });
  }
};

/**
 * @desc    Delete a comment
 * @route   DELETE /api/comments/:id
 * @access  Private (Protected, Ownership check required)
 */
exports.deleteComment = async (req, res) => {
  try {
    // req.comment is attached by ownershipComment middleware
    await Comment.deleteOne({ _id: req.comment._id });

    return res.status(200).json({
      success: true,
      message: 'Comment successfully deleted',
    });
  } catch (error) {
    console.error('Delete comment error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Server error while deleting comment',
    });
  }
};

/**
 * @desc    Get comments for a specific post
 * @route   GET /api/posts/:postId/comments
 * @access  Private (Protected)
 */
exports.getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate('user', 'name avatar')
      .sort({ createdAt: 1 }); // Oldest comments first
    return res.status(200).json({
      success: true,
      data: comments,
    });
  } catch (error) {
    console.error('Get comments error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Server error while retrieving comments',
    });
  }
};
