const express = require('express')
const community = require('../controllers/Community')
const { verifyToken } = require('../middlewares/Verify')
const router = express.Router()

router.route('/:subreddit').get(verifyToken, community.getSortedCommunityPosts)

module.exports = router
