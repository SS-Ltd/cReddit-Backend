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
    if (communityName) {
      message.title = `u/${username} upvoted your post in r/${communityName}`
    } else {
      message.title = `u/${username} upvoted your post`
    }
    message.body = 'Tap to view the post'
    return message
  },
  upvotedComment: (username, communityName) => {
    const message = {}
    if (communityName) {
      message.title = `u/${username} upvoted your comment in r/${communityName}`
    } else {
      message.title = `${username} upvoted your comment`
    }
    message.body = 'Tap to view the comment'
    return message
  },
  comment: (username, communityName) => {
    const message = {}
    message.title = communityName ? `New comment on your post in r/${communityName}` : 'New comment on your post'
    message.body = `u/${username} commented on your post`
    return message
  },
  mention: (username, resource, postTitle) => {
    const message = {}
    if (resource.type === 'Post') {
      if (resource.communityName) {
        message.title = `u/${username} mentioned you in r/${resource.communityName}`
      } else {
        message.title = `u/${username} mentioned you`
      }
      message.body = 'Tap to view the mention'
    } else if (resource.type === 'Comment') {
      message.title = `u/${username} commented in "${postTitle}"`
      message.body = `${resource.content}`
    }
    return message
  },
  follow: (username) => {
    const message = {}
    message.title = `u/${username} started following you`
    message.body = 'Tap to view their profile'
    return message
  },
  message: (username) => {
    const message = {}
    message.title = `New message from u/${username}`
    message.body = 'Tap to view the message'
    return message
  },
  chatMessage: (username) => {
    const message = {}
    message.title = `New chat message from u/${username}`
    message.body = 'Tap to view the chat message'
    return message
  },
  chatRequest: (username) => {
    const message = {}
    message.title = `u/${username} sent you a chat request`
    message.body = 'Tap to view the request'
    return message
  },
  followedPost: () => {
    const message = {}
    message.title = 'New activity on a post you follow'
    message.body = 'Tap to view the post'
    return message
  },
  cakeDay: (username, age) => {
    const message = {}
    message.title = `Happy Cake Day, u/${username}!`
    message.body = `🎂 ${age} years on cReddit! 🎉`
    return message
  },
  chatAdd: (username) => {
    const message = {}
    message.title = `u/${username} added you to a char room`
    message.body = 'Tap to view the chat room'
    return message
  },
  chat: (username, chatMessage) => {
    const message = {}
    message.title = `u/${username}`
    message.body = chatMessage
    return message
  }
}

const sendNotification = async (username, type, resource, notificationFrom, postTitle = null) => {
  const user = await UserModel.findOne({ username: username })

  let messageStr = {}
  if (type === 'cakeDay') {
    messageStr = notificationTemplate[type](username, (resource.age))
  } else if (type === 'upvotedPost' || type === 'comment' || type === 'upvotedComment') {
    messageStr = notificationTemplate[type](notificationFrom, resource.communityName, postTitle)
  } else if (type === 'mention') {
    messageStr = notificationTemplate[type](notificationFrom, resource, postTitle)
  } else if (type === 'followedPost') {
    messageStr = notificationTemplate[type]()
  } else if (type === 'chatAdd') {
    messageStr = notificationTemplate[type](notificationFrom)
  } else if (type === 'chatMessage') {
    messageStr = notificationTemplate[type](notificationFrom, resource.content)
  } else {
    messageStr = notificationTemplate[type](notificationFrom, (resource.username || resource.communityName || resource.age))
  }

  const notification = new NotificationModel({
    user: username,
    notificationFrom: notificationFrom,
    type: type,
    title: messageStr.title,
    content: messageStr.body,
    resourceId: resource._id
  })

  await notification.save()

  const fcmToken = user.fcmToken
  if (fcmToken.length === 0) {
    return
  }

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
            console.error('Failure sending notification to', fcmToken[idx], resp.error)
            failedTokens.push(fcmToken[idx])
          }
        })
        console.log('List of tokens that caused failures: ' + failedTokens)
      }
      console.log('Successfully sent message:', response)
    })
    .catch((error) => {
      console.error('Error sending message:', error)
    })
}

exports.sendNotification = sendNotification
