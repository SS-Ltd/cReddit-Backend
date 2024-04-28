const express = require('express')
const router = express.router

const message = require('../controllers/Message')
const { verifyToken } = require('../middlewares/Verify')

router.route('/').post(verifyToken, message.createMessage).get(verifyToken, message.getMessages)
router.rout('/sent').get(verifyToken, message.getSentMessages)
router.rout('/unread').get(verifyToken, message.getUnreadMessages)
router.route('/:messageId/mark-as-read').patch(verifyToken, message.markAsRead)
router.route('/mark-all-as-read').put(verifyToken, message.markAllAsRead)
router.route('/:messageId').delete(verifyToken, message.deleteMessage)

module.exports = router
