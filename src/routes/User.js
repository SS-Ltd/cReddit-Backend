const express = require('express')
const router = express.Router()
const user = require('../controllers/User')
const verifyToken = require('../middlewares/Verify')

router.post('/follow/:username', verifyToken, user.follow)
router.delete('/unfollow/:username', verifyToken, user.unfollow)

module.exports = router
