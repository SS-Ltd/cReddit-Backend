const express = require('express')
const moderation = require('../controllers/Moderation')
const router = express.Router()
const { verifyToken } = require('../middlewares/Verify')
const { isModerator } = require('../middlewares/VerifyModerator')

router.route('/invite/:communityName').post(verifyToken, isModerator, moderation.inviteModerator)
router.route('/accept-invite/:communityName').patch(verifyToken, moderation.acceptInvitation)
router.route('/reject-invite/:communityName').patch(verifyToken, moderation.rejectInvitation)
router.route('/leave/:communityName').patch(verifyToken, isModerator, moderation.leaveModeration)
router.route('/remove/:communityName').patch(verifyToken, isModerator, moderation.removeModerator)

module.exports = router
