const express = require('express')
const router = express.Router()
const user = require('../controllers/User')
const verifyToken = require('../middlewares/Verify')

router.route('/follow/:username').post(verifyToken, user.follow).delete(verifyToken, user.unfollow)

router.route('/block/:username').post(verifyToken, user.block).delete(verifyToken, user.unblock)

router.get('/is-username-available/:username', user.isUsernameAvailable)

module.exports = router
