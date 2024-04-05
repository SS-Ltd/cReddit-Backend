const express = require('express')
const router = express.Router()
const community = require('../controllers/Community')
const { isLoggedIn, verifyToken } = require('../middlewares/Verify')
const { isModerator } = require('../middlewares/VerifyModerator')

router.route('/').post(verifyToken, community.createCommunity)
router.route('/is-name-available/:name').get(community.isNameAvailable)
router.route('/top').get(isLoggedIn, community.getTopCommunities)
router.route('/about/edited/:communityName').get(verifyToken, isModerator, community.getEditedPosts)
router.route('/:subreddit/posts').get(isLoggedIn, community.getSortedCommunityPosts)

router.route('/:subreddit').get(isLoggedIn, community.getCommunityView)

module.exports = router
