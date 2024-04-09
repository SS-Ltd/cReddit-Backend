const express = require('express')
const post = require('../controllers/Post')
const multer = require('../utils/Multer')
const router = express.Router()
const { isLoggedIn, verifyToken } = require('../middlewares/Verify')

router.route('/').post(verifyToken, multer.uploadMultipleImages, post.createPost)
router.route('/home-feed').get(isLoggedIn, post.getHomeFeed)
router.route('/:postId/save').patch(verifyToken, post.savePost)
router.route('/:postId/hidden').patch(verifyToken, post.hidePost)
router.route('/:postId/lock').patch(verifyToken, post.lockPost)
router.route('/:postId/comments').get(isLoggedIn, post.getComments)
router.route('/:postId/report').post(verifyToken, post.reportPost)

router.route('/:postId').get(isLoggedIn, post.getPost).delete(verifyToken, post.deletePost).patch(verifyToken, post.editPost)

module.exports = router
