const express = require('express')
const user = require('../controllers/User')
const verifyToken = require('../middlewares/Verify')
const jwt = require('../controllers/JWT')
const auth = require('../controllers/Auth')
const router = express.Router()

router.route('/follow/:username').post(verifyToken, user.follow).delete(verifyToken, user.unfollow)
router.route('/block/:username').post(verifyToken, user.block).delete(verifyToken, user.unblock)
router.route('/is-username-available/:username').get(user.isUsernameAvailable)

router.route('/').post(auth.createUser).delete(verifyToken, auth.deleteUser)
router.route('/login').post(auth.login)
router.route('/logout').get(verifyToken, auth.logout)
router.route('/verify/:token').get(auth.verifyUser)
router.route('/refreshToken').get(jwt.refreshToken)

router.route('/forgot-password').post(user.forgotPassword)
router.route('/reset-password/:token').patch(user.resetPassword)
router.route('/forgot-username').post(user.forgotUsername)

router.route('/:username').get(user.getUserView)
router.route('/settings').put(verifyToken, user.updateSettings)
router.route('/settings').get(verifyToken, user.getSettings)

module.exports = router
