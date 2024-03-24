const express = require('express')
const post = require('../controllers/Post')
const multer = require('../utils/Multer')
const router = express.Router()
const verify = require('../middlewares/Verify')

router.use(verify.verifyToken)
router.route('/').post(multer.uploadMultipleImages, post.createPost)
router.route('/:postId').delete(post.deletePost).patch(post.editPost)
router.route('/:postId/save').patch(post.savePost)
router.route('/:postId/hidden').patch(post.hidePost)
router.route('/:postId/lock').patch(post.lockPost)

module.exports = router
