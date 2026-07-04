const Post = require('../models/Post');
const User = require('../models/User');

/**
 * =========================================================================
 * WHY WE USE MONGOOSE POPULATE & HOW IT SOLVES THE N+1 QUERY PROBLEM
 * =========================================================================
 * 
 * 1. THE PROBLEM (N+1 queries):
 *    If we fetch posts from the database, we get documents containing the user's
 *    ObjectId (e.g., user: "65b9...").
 *    If we want to display the user's name and avatar on the UI for 10 posts,
 *    we would have to:
 *      - Query 1: Get 10 posts.
 *      - Query 2 to 11 (N queries): Fetch the user profile for each of those 10 posts.
 *    This leads to N+1 database queries, which is highly inefficient and causes 
 *    severe performance lag as the number of items increases.
 * 
 * 2. THE SOLUTION (.populate()):
 *    Mongoose `.populate('user', 'name avatar')` automates this JOIN-like behavior.
 *    Behind the scenes, Mongoose extracts all unique user ObjectIds from the posts,
 *    makes one single `$in` query to the Users collection (e.g., User.find({ _id: { $in: [ids] } })),
 *    and embeds the resulting user documents into the posts array.
 *    This reduces the database queries from N+1 down to just 2!
 */

/**
 * @desc    Create a new post
 * @route   POST /api/posts
 * @access  Private (Protected)
 */
exports.createPost = async (req, res) => {
  try {
    const { text, image } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Post text is required',
      });
    }

    const post = new Post({
      user: req.user.id, // req.user is attached by the auth middleware
      text,
      image,
    });

    await post.save();

    // Populate user profile details before returning the post
    const populatedPost = await post.populate('user', 'name email avatar');

    return res.status(201).json({
      success: true,
      data: populatedPost,
    });
  } catch (error) {
    console.error('Create post error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Server error while creating post',
    });
  }
};

/**
 * @desc    Get all posts (Global Feed)
 * @route   GET /api/posts
 * @access  Private (Protected)
 */
exports.getPosts = async (req, res) => {
  try {
    // Populate user name and avatar, and sort by newest first (reverse chronological)
    const posts = await Post.find()
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: posts.length,
      data: posts,
    });
  } catch (error) {
    console.error('Get posts error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Server error while fetching posts',
    });
  }
};

/**
 * @desc    Get feed posts (Posts from followed users only)
 * @route   GET /api/posts/feed
 * @access  Private (Protected)
 */
exports.getFeed = async (req, res) => {
  try {
    // 1. Get the list of IDs the current user is following
    const followingUsers = req.user.following; // Array of ObjectIds

    // 2. Fetch posts where the author (user field) is in the current user's following list
    // We also include the user's own posts in their feed
    const feedUsers = [...followingUsers, req.user.id];

    // Using MongoDB's $in operator to find matching documents
    const posts = await Post.find({ user: { $in: feedUsers } })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: posts.length,
      data: posts,
    });
  } catch (error) {
    console.error('Get feed error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Server error while fetching feed',
    });
  }
};

/**
 * @desc    Update a post
 * @route   PUT /api/posts/:id
 * @access  Private (Protected, Ownership check required)
 */
exports.updatePost = async (req, res) => {
  try {
    const { text, image } = req.body;

    // req.post is attached by ownershipPost middleware
    if (text) req.post.text = text;
    if (image !== undefined) req.post.image = image;

    await req.post.save();

    // Populate user info for client response rendering
    const updatedPost = await req.post.populate('user', 'name avatar');

    return res.status(200).json({
      success: true,
      data: updatedPost,
    });
  } catch (error) {
    console.error('Update post error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Server error while updating post',
    });
  }
};

/**
 * @desc    Delete a post
 * @route   DELETE /api/posts/:id
 * @access  Private (Protected, Ownership check required)
 */
exports.deletePost = async (req, res) => {
  try {
    // req.post is attached by ownershipPost middleware
    await Post.deleteOne({ _id: req.post._id });

    // Note: In a production app, we would also delete all Comments associated
    // with this post to prevent database pollution. We will delete them below:
    const Comment = require('../models/Comment');
    await Comment.deleteMany({ post: req.post._id });

    return res.status(200).json({
      success: true,
      message: 'Post and associated comments successfully deleted',
    });
  } catch (error) {
    console.error('Delete post error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Server error while deleting post',
    });
  }
};

/**
 * @desc    Toggle Like on a post (Like/Unlike)
 * @route   POST /api/posts/like/:postId
 * @access  Private (Protected)
 */
exports.toggleLike = async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user.id;

    // 1. Locate the post
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    // 2. Determine if user has already liked the post
    const isLiked = post.likes.includes(userId);

    let updateQuery;
    if (isLiked) {
      // User already liked it: Unlike (Atomic removal via $pull)
      updateQuery = { $pull: { likes: userId } };
    } else {
      // User hasn't liked it: Like (Atomic unique addition via $addToSet)
      updateQuery = { $addToSet: { likes: userId } };
    }

    // 3. Update post atomically in the database
    const updatedPost = await Post.findByIdAndUpdate(postId, updateQuery, {
      new: true, // Return updated document
    }).populate('user', 'name avatar');

    return res.status(200).json({
      success: true,
      isLiked: !isLiked,
      likesCount: updatedPost.likes.length,
      data: updatedPost,
    });
  } catch (error) {
    console.error('Like toggle error:', error.message);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid post ID format',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Server error during like toggling',
    });
  }
};
