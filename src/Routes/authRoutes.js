const express = require('express')
const authController = require('../Controllers/authController')

const router = express.Router()

router.route('/forget-password').post(authController.forgetPassword)

module.exports = router
