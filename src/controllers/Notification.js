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
