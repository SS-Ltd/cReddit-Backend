const express = require('express')
const user = require('../controllers/User')
const verifyToken = require('../middlewares/Verify')
const jwt = require('../controllers/JWT')
const auth = require('../controllers/Auth')
const router = express.Router()

router.route('/follow/:username').post(verifyToken, user.follow).delete(verifyToken, user.unfollow)
router.route('/block/:username').post(verifyToken, user.block).delete(verifyToken, user.unblock)
router.get('/is-username-available/:username', user.isUsernameAvailable)

router.post('/', auth.createUser)
router.delete('/', verifyToken, auth.deleteUser)
router.post('/login', auth.login)
router.get('/logout', verifyToken, auth.logout)
router.get('/verify/:token', auth.verifyUser)
router.get('/refreshToken', jwt.refreshToken)

router.route('/forgot-password').post(user.forgetPassword)
router.route('/reset-password/:token').patch(user.resetPassword)
router.route('/forgot-username').post(user.forgotUsername)

module.exports = router
