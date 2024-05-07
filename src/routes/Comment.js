const express = require('express')
const comment = require('../controllers/Comment')
const multer = require('../utils/Multer')
const router = express.Router()
const { verifyToken, isLoggedIn } = require('../middlewares/Verify')
const { isPrivate } = require('../middlewares/VerifyModerator')

router.route('/').post(verifyToken, multer.uploadMultipleImages, comment.createComment)
router.route('/:commentId').patch(verifyToken, isPrivate, multer.uploadMultipleImages, comment.editComment).delete(verifyToken, isPrivate, comment.deleteComment).get(isLoggedIn, isPrivate, comment.getComment)

module.exports = router
