const express = require('express')
const post = require('../controllers/Post')
const router = express.Router()
const { isLoggedIn } = require('../middlewares/Verify')

router.route('/:postId').get(isLoggedIn, post.getPost)

module.exports = router
