const express = require('express')
const userController = require('../controllers/User')

const router = express.Router()

router.route('/forget-password').post(userController.forgetPassword)
router.route('/reset-password/:token').patch(userController.resetPassword)
router.route('/forget-username').post(userController.forgotUsername)

module.exports = router
