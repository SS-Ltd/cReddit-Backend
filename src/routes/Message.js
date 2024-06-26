const express = require('express')
const router = express.Router()

const message = require('../controllers/Message')
const { verifyToken } = require('../middlewares/Verify')

router.route('/').post(verifyToken, message.createMessage).get(verifyToken, message.getMessages)
router.route('/inbox').get(verifyToken, message.getInbox)
router.route('/sent').get(verifyToken, message.getSentMessages)
router.route('/post-replies').get(verifyToken, message.getPostReplies)
router.route('/username-mentions').get(verifyToken, message.getUsernameMentions)
router.route('/unread').get(verifyToken, message.getUnreadMessages)
router.route('/:messageId/mark-as-read').patch(verifyToken, message.markAsRead)
router.route('/mark-all-as-read').put(verifyToken, message.markAllAsRead)
router.route('/:messageId').delete(verifyToken, message.deleteMessage)

module.exports = router
