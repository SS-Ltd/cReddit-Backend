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
router.route('/ban/:communityName').patch(verifyToken, isModerator, moderation.banUser)
router.route('/unban/:communityName').patch(verifyToken, isModerator, moderation.unbanUser)
router.route('/approve/:communityName').patch(verifyToken, isModerator, moderation.approveUser)
router.route('/unapprove/:communityName').patch(verifyToken, isModerator, moderation.unapproveUser)

module.exports = router
