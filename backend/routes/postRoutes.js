const express = require('express');
const {
  createPost,
  getPosts,
  getFeed,
  updatePost,
  deletePost,
  toggleLike,
} = require('../controllers/postController');
const auth = require('../middleware/auth');
const ownershipPost = require('../middleware/ownershipPost');

const router = express.Router();

// All post routes require authentication
router.post('/', auth, createPost);
router.get('/', auth, getPosts); // Global feed
router.get('/feed', auth, getFeed); // Followed users feed

// Modifying posts requires both authentication AND ownership of the post
router.put('/:id', auth, ownershipPost, updatePost);
router.delete('/:id', auth, ownershipPost, deletePost);

// Like toggle route
router.post('/like/:postId', auth, toggleLike);

module.exports = router;
