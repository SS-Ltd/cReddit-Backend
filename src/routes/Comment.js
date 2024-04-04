const express = require('express')
const comment = require('../controllers/Comment')
const router = express.Router()
const { isLoggedIn } = require('../middlewares/Verify')

router.route('/:commentId').get(isLoggedIn, comment.getComment)

module.exports = router
