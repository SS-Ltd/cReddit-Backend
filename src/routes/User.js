const express = require('express')
const user = require('../controllers/User')
const { verifyToken, verifyGoogleToken } = require('../middlewares/Verify')
const jwt = require('../controllers/JWT')
const auth = require('../controllers/Auth')
const router = express.Router()

router.route('/').post(auth.createUser).delete(verifyToken, auth.deleteUser)
router.route('/login').post(auth.login)
router.route('/auth/google').post(verifyGoogleToken, auth.loginGoogle)
router.route('/logout').get(verifyToken, auth.logout)
router.route('/verify/:token').get(auth.verifyUser)
router.route('/refresh-token').get(jwt.refreshToken)

router.route('/follow/:username').post(verifyToken, user.follow).delete(verifyToken, user.unfollow)
router.route('/block/:username').post(verifyToken, user.block).delete(verifyToken, user.unblock)
router.route('/is-username-available/:username').get(user.isUsernameAvailable)

router.route('/forgot-password').post(user.forgotPassword)
router.route('/reset-password/:token').patch(user.resetPassword)
router.route('/forgot-username').post(user.forgotUsername)
router.route('/change-password').patch(verifyToken, user.changePassword)
router.route('/change-email').patch(verifyToken, user.changeEmail)
router.route('/saved').get(verifyToken, user.getSaved)
router.route('/hidden-posts').get(verifyToken, user.getHiddenPosts)

router.route('/settings').put(verifyToken, user.updateSettings).get(verifyToken, user.getSettings)
router.route('/:username/posts').get(user.getPosts)
router.route('/upvoted').get(verifyToken, user.getUpvotedPosts)
router.route('/downvoted').get(verifyToken, user.getDownvotedPosts)

router.route('/:username').get(user.getUserView)

module.exports = router
