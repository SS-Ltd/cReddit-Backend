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
    if (communityName) 
      message.title = `${username} upvoted your post in r/${communityName}`
    else
      message.title = `${username} upvoted your post`
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
  mention: (username, communityName) => {
    const message = {}
    if (communityName)
      message.title = `u/${username} mentioned you in r/${communityName}`
    else
      message.title = `u/${username} mentioned you`
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

const sendNotification = async (username, type, resource, notificationFrom) => { // username: reciever, notificationFrom: sender
  const user = await UserModel.findOne({ username: username })
  const fcmToken = user.fcmToken
  console.log("fcmToken: ", fcmToken)
  if (!fcmToken) {
    return
  }

  let messageStr = {}
  if (type === 'cakeDay') {
    messageStr = notificationTemplate[type](username, (resource.age))
  } else if (type === 'upvotedPost' || type === 'mention') {
    messageStr = notificationTemplate[type](notificationFrom, resource.communityName)
  } else {
    messageStr = notificationTemplate[type](notificationFrom, (resource.username || resource.communityName || resource.age))
  }

  const notification = new NotificationModel({
    user: username,
    notificationFrom: notificationFrom,
    type: type,
    message: messageStr,
    resourceId: resource._id
  })

  await notification.save()

  const message = {
    notification: {
      title: messageStr.title,
      body: messageStr.body
    },
    tokens: fcmToken
  }

  getMessaging().sendEachForMulticast(message)
    .then((response) => {
      if (response.failureCount > 0) {
        const failedTokens = []
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(fcmToken[idx])
          }
        })
        console.log('List of tokens that caused failures: ' + failedTokens);
      }
      console.log('Successfully sent message:', response)
    })
    .catch((error) => {
      console.log('Error sending message:', error)
    })
}

exports.sendNotification = sendNotification
