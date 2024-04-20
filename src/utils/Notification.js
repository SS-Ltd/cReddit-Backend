const NotificationModel = require('../models/Notification')
const UserModel = require('../models/User')
const admin = require('firebase-admin')
const { getMessaging } = require('firebase-admin/messaging')

const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS)

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const notificationTemplate = {
  upvotedPost: (username, communityName) => {
    const message = {}
    message.title = `${username} upvoted your post in ${communityName}`
    message.body = 'Tap to view the post'
    return message
  },
  upvotedComment: (username, communityName) => {
    const message = {}
    message.title = `${username} upvoted your comment in ${communityName}`
    message.body = 'Tap to view the comment'
    return message
  },
  comment: (username, communityName) => {
    const message = {}
    message.title = `New comment on your post in ${communityName}`
    message.body = `u/${username} commented on your post`
    return message
  },
  mention: (username) => {
    const message = {}
    message.title = `You were mentioned by ${username}`
    message.body = 'Tap to view the mention'
    return message
  },
  follow: (username) => {
    const message = {}
    message.title = `${username} started following you`
    message.body = 'Tap to view their profile'
    return message
  },
  message: (username) => {
    const message = {}
    message.title = `New message from ${username}`
    message.body = 'Tap to view the message'
    return message
  },
  chatMessage: (username) => {
    const message = {}
    message.title = `New chat message from ${username}`
    message.body = 'Tap to view the chat message'
    return message
  },
  chatRequest: (username) => {
    const message = {}
    message.title = `${username} sent you a chat request`
    message.body = 'Tap to view the request'
    return message
  },
  cakeDay: (username, age) => {
    const message = {}
    message.title = `Happy Cake Day, u/${username}!`
    message.body = `🎂 ${age} years on cReddit! 🎉`
    return message
  }
}

const sendNotification = async (username, type, resource) => {
  const user = await UserModel.findOne({ username: username })
  const fcmToken = user.fcmToken
  // if (!fcmToken) {
  //  return
  // }
  const messageStr = notificationTemplate[type](username, resource)
  const follower = await UserModel.findOne({ username: resource })

  const notification = new NotificationModel({
    user: username,
    type: type,
    message: messageStr,
    resourceId: follower._id
  })

  await notification.save()

  const message = {
    notification: {
      title: messageStr.title,
      body: messageStr.body
    },
    token: 'dVvEXUqK_01haA_2yW6TLn:APA91bHxpKhNObAYge7DNw8NJ_Q3apl9nWHM5vdV5x0F4NGfKySi4QfGBEDx0VVItGCZW6OFpfpSSLunRd7MSHucqfxHAKaTrSqiNx8VKRqOdg3cL887NcYjoqBhCx1gpjdqwJfBzQxi'
  }

  getMessaging().send(message)
    .then((response) => {
      console.log('Successfully sent notification: ' + response)
    })
    .catch((error) => {
      console.log('Error sending notification: ' + error)
    })
}

exports.sendNotification = sendNotification
