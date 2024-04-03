const express = require('express')
const comment = require('../controllers/Comment')
const multer = require('../utils/Multer')
const router = express.Router()
const { verifyToken } = require('../middlewares/Verify')

router.route('/').post(verifyToken, multer.uploadMultipleImages, comment.createComment)

module.exports = router
