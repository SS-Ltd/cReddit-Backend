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
router.route('/:communityName/reported-posts').get(verifyToken, isModerator, community.getReportedPosts)

router.route('/:subreddit/mute').post(verifyToken, community.muteCommunity).delete(verifyToken, community.muteCommunity)
router.route('/:subreddit/join').post(verifyToken, community.joinCommunity).delete(verifyToken, community.leaveCommunity)
router.route('/:subreddit').get(isLoggedIn, community.getCommunityView)

module.exports = router
