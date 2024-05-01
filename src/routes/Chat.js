const express = require('express')
const chat = require('../controllers/Chat')
const { verifyToken } = require('../middlewares/Verify')
const router = express.Router()

router.route('/').post(verifyToken, chat.createChatRoom).get(verifyToken, chat.getRooms)
router.route('/:roomId').get(verifyToken, chat.getRoomChat)

module.exports = router
