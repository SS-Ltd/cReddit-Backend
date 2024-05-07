const express = require('express')
const chat = require('../controllers/Chat')
const { verifyToken } = require('../middlewares/Verify')
const router = express.Router()

router.route('/').post(verifyToken, chat.createChatRoom).get(verifyToken, chat.getRooms)
router.route('/:roomId/mark-as-read').patch(verifyToken, chat.markAllMessagesAsRead)
router.route('/:roomId').get(verifyToken, chat.getRoomChat)
router.route('/leaveChat/:roomId').delete(verifyToken, chat.leaveChatRoom)

module.exports = router
