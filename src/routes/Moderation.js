const express = require('express')
const moderation = require('../controllers/Moderation')
const router = express.Router()
const { verifyToken } = require('../middlewares/Verify')
const { isModerator } = require('../middlewares/VerifyModerator')

router.route('/invite/:communityName').post(verifyToken, isModerator, moderation.inviteModerator)

module.exports = router
