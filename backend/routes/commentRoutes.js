const express = require('express');
const { addComment, deleteComment, getComments } = require('../controllers/commentController');
const auth = require('../middleware/auth');
const ownershipComment = require('../middleware/ownershipComment');

const router = express.Router();

/**
 * Comment Management Routes
 * Mounted at `/api` in server.js to maintain the path structure:
 * - POST /api/posts/:postId/comments
 * - DELETE /api/comments/:id
 */

// Add comment to a post
router.post('/posts/:postId/comments', auth, addComment);

// Fetch comments for a post
router.get('/posts/:postId/comments', auth, getComments);

// Delete comment (requires user to own the comment)
router.delete('/comments/:id', auth, ownershipComment, deleteComment);

module.exports = router;
