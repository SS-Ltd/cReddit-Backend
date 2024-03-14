const express = require('express')
const router = express.Router()
const user = require('../controllers/User')
const verifyToken = require('../middlewares/Verify')

router.post('/follow/:username', verifyToken, user.follow)
router.delete('/unfollow/:username', verifyToken, user.unfollow)

router.post('/block/:username', verifyToken, user.block)
router.delete('/unblock/:username', verifyToken, user.unblock)

module.exports = router
