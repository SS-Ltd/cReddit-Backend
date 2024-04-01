const express = require('express')
const community = require('../controllers/Community')
const { isLoggedIn } = require('../middlewares/Verify')
const router = express.Router()

router.route('/:subreddit').get(isLoggedIn, community.getSortedCommunityPosts)

module.exports = router
