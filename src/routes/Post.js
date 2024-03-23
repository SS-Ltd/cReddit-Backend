const express = require('express')
const post = require('../controllers/Post')
const multer = require('../utils/Multer')
const router = express.Router()
const verify = require('../middlewares/Verify')

router.use(verify.verifyToken)
router.route('/').post(multer.uploadMultipleImages, post.createPost)
router.route('/:postId').delete(post.deletePost).patch(post.editPost)

module.exports = router
