const express = require('express')
const post = require('../controllers/Post')
const multer = require('../utils/Multer')
const router = express.Router()
const { isLoggedIn, verifyToken } = require('../middlewares/Verify')

router.route('/').post(verifyToken, multer.uploadMultipleImages, post.createPost)
router.route('/:postId').delete(verifyToken, post.deletePost).patch(verifyToken, post.editPost)
router.route('/:postId/save').patch(verifyToken, post.savePost)
router.route('/:postId/hidden').patch(verifyToken, post.hidePost)
router.route('/:postId/lock').patch(verifyToken, post.lockPost)

router.route('/:postId').get(isLoggedIn, post.getPost)

module.exports = router
