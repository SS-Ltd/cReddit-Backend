const express = require('express')
const router = express.Router()
const community = require('../controllers/Community')
const { verifyToken } = require('../middlewares/Verify')
const { isModerator } = require('../middlewares/VerifyModerator')

router.route('/top').get(community.getTopCommunities) // NOTE: we will add  verify token middleware here
router.route('/about/edited/:communityName').get(verifyToken, isModerator, community.getEditedPosts)

module.exports = router
