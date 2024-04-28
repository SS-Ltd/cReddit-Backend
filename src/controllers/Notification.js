const NotificationModel = require('../models/Notification')
const UserModel = require('../models/User')

const subscribe = async (req, res) => {
  try {
    const username = req.decoded.username
    const { fcmToken } = req.body

    const user = await UserModel.findOne({ username: username })

    if (user.fcmToken.includes(fcmToken)) {
      return res.status(400).json({ message: 'Already subscribed' })
    }

    user.fcmToken.push(fcmToken)

    await user.save()

    res.status(200).json({ message: 'Subscribed successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const unsubscribe = async (req, res) => {
  try {
    const username = req.decoded.username
    const { fcmToken } = req.body

    const user = await UserModel.findOne({ username: username })

    if (!user.fcmToken.includes(fcmToken)) {
      return res.status(400).json({ message: 'Already unsubscribed' })
    }

    user.fcmToken = user.fcmToken.filter(token => token !== fcmToken)

    await user.save()

    res.status(200).json({ message: 'Unsubscribed successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const getNotifications = async (req, res) => {
  try {
    const username = req.decoded.username

    const options = {
      username: username,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10
    }

    const notifications = await NotificationModel.getNotifications(options)

    console.log(notifications)

    res.status(200).json({ notifications: notifications })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const markAllAsRead = async (req, res) => {
  try {
    const username = req.decoded.username

    await NotificationModel.updateMany({ user: username }, { read: true })

    res.status(200).json({ message: 'All notifications marked as read' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const markAsRead = async (req, res) => {
  try {
    const username = req.decoded.username
    const notificationId = req.params.notificationId

    await NotificationModel.findOneAndUpdate({ _id: notificationId, user: username }, { read: true })

    res.status(200).json({ message: 'Notification marked as read' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const getNotificationCount = async (req, res) => {
  try {
    const username = req.decoded.username

    const count = await NotificationModel.countDocuments({ user: username, isRead: false })

    res.status(200).json({ count: count })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = {
  subscribe,
  unsubscribe,
  getNotifications,
  markAllAsRead,
  markAsRead,
  getNotificationCount
}
