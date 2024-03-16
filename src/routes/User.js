const express = require('express')
const userController = require('../controllers/User')

const router = express.Router()

router.route('/forget-password').post(userController.forgetPassword)
router.route('/reset-password/:token').patch(userController.resetPassword)
router.route('/forget-username').post(userController.forgotUsername)
router.route('/change-password').patch(userController.changePassword)
router.route('/change-email').patch(userController.changeEmail)

module.exports = router
