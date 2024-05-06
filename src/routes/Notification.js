const express = require('express')
const router = express.Router()
const notification = require('../controllers/Notification')
const { verifyToken } = require('../middlewares/Verify')

router.route('/subscribe').post(verifyToken, notification.subscribe).delete(verifyToken, notification.unsubscribe)
router.route('/mark-all-as-read').put(verifyToken, notification.markAllAsRead)
router.route('/{notificationId}/mark-as-read').put(verifyToken, notification.markAsRead)
router.route('/unread-count').get(verifyToken, notification.getUnreadCount)

router.route('/').get(verifyToken, notification.getNotifications)
module.exports = router
