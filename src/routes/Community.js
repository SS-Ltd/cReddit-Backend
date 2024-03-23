const express = require('express')
const router = express.Router()
const community = require('../controllers/Community')
const { verifyToken } = require('../middlewares/Verify')
const { isModerator } = require('../middlewares/VerifyModerator')

router.route('/top').get(verifyToken, community.getTopCommunities)
router.route('/about/edited/:communityName').get(verifyToken, isModerator, community.getEditedPosts)

module.exports = router
