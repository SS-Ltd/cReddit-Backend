const router = express.Router()
const user = require('../controllers/User')
const verifyToken = require('../middlewares/Verify')
const { refreshToken } = require('../controllers/JWT')
const { auth } = require('../controllers/Auth')

router.route('/follow/:username').post(verifyToken, user.follow).delete(verifyToken, user.unfollow)
router.route('/block/:username').post(verifyToken, user.block).delete(verifyToken, user.unblock)
router.get('/is-username-available/:username', user.isUsernameAvailable)

router.post('/', auth.createUser)
router.delete('/', verifyToken, auth.deleteUser)
router.post('/login', auth.login)
router.get('/logout', verifyToken, auth.logout)
router.get('/verify/:token', auth.verifyUser)
router.get('/refreshToken', auth.refreshToken)

router.route('/forgot-password').post(user.forgotPassword)
router.route('/reset-password/:token').patch(user.resetPassword)
router.route('/forgot-username').post(user.forgotUsername)
router.route('/change-password').patch(user.changePassword)
router.route('/change-email').patch(user.changeEmail)

module.exports = router
