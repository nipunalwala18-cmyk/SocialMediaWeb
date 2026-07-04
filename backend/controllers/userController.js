const User = require('../models/User');

/**
 * =========================================================================
 * PREVENTING DATABASE RACE CONDITIONS WITH ATOMIC OPERATIONS ($addToSet / $pull)
 * =========================================================================
 * 
 * 1. THE DANGER OF NON-ATOMIC UPDATES:
 *    If we did:
 *      let user = await User.findById(req.user.id);
 *      user.following.push(targetId);
 *      await user.save();
 *    This is a "read-modify-write" operation. If the user triggers multiple requests
 *    simultaneously, both reads could happen before either write, causing one 
 *    update to overwrite the other, resulting in lost data or duplicate followings.
 * 
 * 2. ATOMIC OPERATORS TO THE RESCUE:
 *    MongoDB's `$addToSet` and `$pull` execute the update directly on the database 
 *    in a single atomic transaction.
 *    - `$addToSet` adds the ID to the array ONLY if it doesn't already exist (uniqueness).
 *    - `$pull` removes all instances of the ID from the array.
 *    No document is pulled into the Node.js process memory to make modifications,
 *    eliminating race conditions.
 * 
 * 3. MUTUAL RELATIONSHIPS:
 *    A "follow" is mutual: User A follows User B.
 *    - User A's `following` array must contain User B.
 *    - User B's `followers` array must contain User A.
 *    We run both updates concurrently using Promise.all() to improve response time.
 */

/**
 * @desc    Follow a user
 * @route   POST /api/users/follow/:userId
 * @access  Private (Protected)
 */
exports.followUser = async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user.id;

    // 1. Prevent user from following themselves
    if (currentUserId === targetUserId) {
      return res.status(400).json({
        success: false,
        error: 'You cannot follow yourself',
      });
    }

    // 2. Check if the target user actually exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: 'User to follow not found',
      });
    }

    // 3. Perform atomic operations concurrently
    await Promise.all([
      // Add target user to current user's following array
      User.findByIdAndUpdate(currentUserId, {
        $addToSet: { following: targetUserId },
      }),
      // Add current user to target user's followers array
      User.findByIdAndUpdate(targetUserId, {
        $addToSet: { followers: currentUserId },
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Successfully followed user',
    });
  } catch (error) {
    console.error('Follow error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Server error during follow process',
    });
  }
};

/**
 * @desc    Unfollow a user
 * @route   POST /api/users/unfollow/:userId
 * @access  Private (Protected)
 */
exports.unfollowUser = async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user.id;

    // Prevent user from unfollowing themselves (unnecessary action check)
    if (currentUserId === targetUserId) {
      return res.status(400).json({
        success: false,
        error: 'You cannot unfollow yourself',
      });
    }

    // Check if target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: 'User to unfollow not found',
      });
    }

    // Perform atomic removals concurrently
    await Promise.all([
      // Remove target user from current user's following array
      User.findByIdAndUpdate(currentUserId, {
        $pull: { following: targetUserId },
      }),
      // Remove current user from target user's followers array
      User.findByIdAndUpdate(targetUserId, {
        $pull: { followers: currentUserId },
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Successfully unfollowed user',
    });
  } catch (error) {
    console.error('Unfollow error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Server error during unfollow process',
    });
  }
};

/**
 * @desc    Get user profile details by ID
 * @route   GET /api/users/:userId
 * @access  Private (Protected)
 */
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Fetch posts authored by this specific user
    const Post = require('../models/Post');
    const posts = await Post.find({ user: user._id })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      user,
      posts,
    });
  } catch (error) {
    console.error('Get user profile error:', error.message);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format',
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Server error retrieving profile details',
    });
  }
};
