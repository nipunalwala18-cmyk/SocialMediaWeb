const express = require('express');
const { followUser, unfollowUser, getUserProfile } = require('../controllers/userController');
const auth = require('../middleware/auth');

const router = express.Router();

// Get profile details & user posts
router.get('/:userId', auth, getUserProfile);

// Follow/Unfollow routes. Both require valid JWT session.
router.post('/follow/:userId', auth, followUser);
router.post('/unfollow/:userId', auth, unfollowUser);

module.exports = router;
