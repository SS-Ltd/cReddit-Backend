const UserModel = require('../src/models/User')
const NotificationModel = require('../src/models/Notification')
const MessageModel = require('../src/models/Message')
const { subscribe, unsubscribe, getNotifications, markAllAsRead, markAsRead, getUnreadCount } = require('../src/controllers/Notification')

jest.mock('../src/models/Notification', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getNotifications: jest.fn().mockResolvedValue(notifications),
      updateMany: jest.fn().mockResolvedValue({ nModified: 1 }),
      findOneAndUpdate: jest.fn().mockResolvedValue({}),
      save: jest.fn().mockResolvedValue({})
    }
  })
})

describe('Subscribe Notification', () => {
// Successfully subscribe a user with a new fcmToken
  test('should successfully subscribe a user with a new fcmToken', async () => {
    const req = {
      decoded: {
        username: 'testuser'
      },
      body: {
        fcmToken: 'newToken'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const user = {
      fcmToken: []
    }

    UserModel.findOne = jest.fn().mockResolvedValue(user)
    user.save = jest.fn().mockResolvedValue(user)

    await subscribe(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testuser' })
    expect(user.fcmToken.includes('newToken')).toBe(true)
    expect(user.save).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: 'Subscribed successfully' })
  })

  test('should successfully subscribe a user with an existing fcmToken', async () => {
    const req = {
      decoded: {
        username: 'testuser'
      },
      body: {
        fcmToken: 'existingToken'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const user = {
      fcmToken: ['existingToken']
    }

    UserModel.findOne = jest.fn().mockResolvedValue(user)

    await subscribe(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testuser' })
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Already subscribed' })
  })

  test('should return an error when fcmToken is null or undefined', async () => {
    const req = {
      decoded: {
        username: 'testuser'
      },
      body: {
        fcmToken: null
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const user = {
      fcmToken: null
    }

    UserModel.findOne = jest.fn().mockResolvedValue(user)

    await subscribe(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testuser' })
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ message: "Cannot read properties of null (reading 'includes')" })
  })
})

describe('Unsubscribe Notification', () => {
  test('should unsubscribe a valid fcmToken for a user with multiple fcmTokens', async () => {
    const req = {
      decoded: {
        username: 'testuser'
      },
      body: {
        fcmToken: 'validToken'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const user = {
      fcmToken: ['validToken', 'anotherToken'],
      save: jest.fn()
    }

    UserModel.findOne = jest.fn().mockResolvedValue(user)

    await unsubscribe(req, res)

    expect(user.fcmToken).toEqual(['anotherToken'])
    expect(user.save).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: 'Unsubscribed successfully' })
  })

  test('should return a 400 error message when fcmToken is already unsubscribed', async () => {
    const req = {
      decoded: {
        username: 'testuser'
      },
      body: {
        fcmToken: 'unsubscribedToken'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const user = {
      fcmToken: ['validToken', 'anotherToken'],
      save: jest.fn()
    }

    UserModel.findOne = jest.fn().mockResolvedValue(user)

    await unsubscribe(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Already unsubscribed' })
  })

  test('should return a 500 error message if there is an error while unsubscribing', async () => {
    const req = {
      decoded: {
        username: 'testuser'
      },
      body: {
        fcmToken: 'validToken'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    UserModel.findOne = jest.fn().mockRejectedValue(new Error('Database error'))

    await unsubscribe(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ message: 'Database error' })
  })
})

const notifications = [
  {
    user: 'testUser',
    notificationFrom: 'anotherUser',
    type: 'mention',
    resourceId: '123',
    title: 'You have been mentioned',
    content: 'You have been mentioned in a post',
    isRead: false
  }
]

describe('Get Notifications', () => {
  test('should retrieve notifications for a given user', async () => {
    const req = {
      decoded: {
        username: 'testUser'
      },
      query: {}
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    NotificationModel.getNotifications = jest.fn().mockResolvedValue(notifications)

    await getNotifications(req, res)

    expect(NotificationModel.getNotifications).toHaveBeenCalledWith({
      username: 'testUser',
      page: 1,
      limit: 10
    })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ notifications: notifications })
  })

  test('should return status code 500 if an error occurs while retrieving notifications', async () => {
    const req = {
      decoded: {
        username: 'testUser'
      },
      query: {}
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    NotificationModel.getNotifications = jest.fn().mockRejectedValue(new Error('Error retrieving notifications'))

    await getNotifications(req, res)

    expect(NotificationModel.getNotifications).toHaveBeenCalledWith({
      username: 'testUser',
      page: 1,
      limit: 10
    })
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ message: 'Error retrieving notifications' })
  })
})

describe('Mark all Notifications as Read', () => {
  test('should update all notifications for a given user to be marked as read', async () => {
    const req = {
      decoded: {
        username: 'testUser'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    NotificationModel.updateMany = jest.fn().mockResolvedValue({ nModified: 1 })

    await markAllAsRead(req, res)

    expect(NotificationModel.updateMany).toHaveBeenCalledWith({ user: 'testUser' }, { isRead: true })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: 'All notifications marked as read' })
  })

  test('should return a 500 status code with an error message when there is an error updating the notifications', async () => {
    const req = {
      decoded: {
        username: 'testUser'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const errorMessage = 'Error updating notifications'
    NotificationModel.updateMany.mockRejectedValueOnce(new Error(errorMessage))

    NotificationModel.updateMany = jest.fn().mockRejectedValue(new Error(errorMessage))

    await markAllAsRead(req, res)

    expect(NotificationModel.updateMany).toHaveBeenCalledWith({ user: 'testUser' }, { isRead: true })
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ message: errorMessage })
  })
})

describe('Mark Notification as Read', () => {
  test('should successfully mark a notification as read for a given user', async () => {
    const req = {
      decoded: {
        username: 'testUser'
      },
      params: {
        notificationId: 'notificationId'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    NotificationModel.findOneAndUpdate = jest.fn().mockResolvedValue({})

    await markAsRead(req, res)

    expect(NotificationModel.findOneAndUpdate).toHaveBeenCalledWith({ _id: 'notificationId', user: 'testUser' }, { isRead: true })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: 'Notification marked as read' })
  })

  test('should return a 500 status code with an error message when there is an error updating the notifications', async () => {
    const req = {
      decoded: {
        username: 'testUser'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const errorMessage = 'Error updating notifications'
    NotificationModel.updateMany.mockRejectedValueOnce(new Error(errorMessage))

    await markAllAsRead(req, res)

    expect(NotificationModel.updateMany).toHaveBeenCalledWith({ user: 'testUser' }, { isRead: true })
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ message: errorMessage })
  })
})

describe('Get Unread Count', () => {
  test('should return the correct unread notification and message count for a valid user', async () => {
    const req = {
      decoded: {
        username: 'validUser'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    NotificationModel.countDocuments = jest.fn().mockResolvedValue(10)
    MessageModel.countDocuments = jest.fn().mockResolvedValue(5)

    await getUnreadCount(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      unreadNotificationCount: 10,
      unreadMessageCount: 5,
      total: 15
    })
  })

  test('should return a 500 status code with an error message when there is an error retrieving the unread notification count', async () => {
    const req = {
      decoded: {
        username: 'validUser'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const errorMessage = 'Error retrieving unread notification count'
    NotificationModel.countDocuments.mockRejectedValueOnce(new Error(errorMessage))

    await getUnreadCount(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ message: errorMessage })
  })
})

jest.mock('firebase-admin/messaging', () => ({
  getMessaging: jest.fn().mockReturnValue({
    sendEachForMulticast: jest.fn().mockResolvedValue({ failureCount: 0 })
  })
}))

jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn()
  },
  messaging: jest.fn(() => ({
    sendEachForMulticast: jest.fn().mockResolvedValue({ failureCount: 0, responses: [] })
  }))
}))

const { sendNotification } = require('../src/utils/Notification')

describe('sendNotification', () => {
  const { getMessaging } = require('firebase-admin/messaging')

  test('should send a notification when user has a valid FCM token', async () => {
    // Mock UserModel.findOne to return a user with a valid FCM token
    const mockUser = {
      username: 'testUser',
      fcmToken: 'validToken'
    }
    UserModel.findOne = jest.fn().mockResolvedValue(mockUser)

    // Mock NotificationModel.save to resolve successfully
    const notif = {
      save: jest.fn().mockResolvedValue({})
    }
    NotificationModel.mockReturnValue(notif)

    // Mock getMessaging().sendEachForMulticast to resolve successfully
    getMessaging().sendEachForMulticast = jest.fn().mockResolvedValue({ failureCount: 0 })

    // Call the sendNotification function
    await sendNotification('testUser', 'upvotedPost', { communityName: 'testCommunity' }, 'notificationFrom', 'postTitle')

    // Assert that UserModel.findOne is called with the correct arguments
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser' })

    // Assert that NotificationModel.save is called with the correct arguments
    expect(notif.save).toHaveBeenCalledWith()

    // Assert that getMessaging().sendEachForMulticast is called with the correct arguments
    expect(getMessaging().sendEachForMulticast).toHaveBeenCalledWith({
      notification: {
        title: 'u/notificationFrom upvoted your post in r/testCommunity',
        body: 'Tap to view the post'
      },
      tokens: 'validToken'
    })
  })

  test('should send a cake day notification when user has a valid FCM token', async () => {
    // Mock UserModel.findOne to return a user with a valid FCM token
    const mockUser = {
      username: 'testUser',
      fcmToken: 'validToken'
    }
    UserModel.findOne = jest.fn().mockResolvedValue(mockUser)

    // Mock NotificationModel.save to resolve successfully
    const notif = {
      save: jest.fn().mockResolvedValue({})
    }
    NotificationModel.mockReturnValue(notif)

    // Mock getMessaging().sendEachForMulticast to resolve successfully
    getMessaging().sendEachForMulticast = jest.fn().mockResolvedValue({ failureCount: 0 })

    // Call the sendNotification function
    await sendNotification('testUser', 'cakeDay', { age: 5 }, 'notificationFrom')

    // Assert that UserModel.findOne is called with the correct arguments
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser' })

    // Assert that NotificationModel.save is called with the correct arguments
    expect(notif.save).toHaveBeenCalledWith()

    // Assert that getMessaging().sendEachForMulticast is called with the correct arguments
    expect(getMessaging().sendEachForMulticast).toHaveBeenCalledWith({
      notification: {
        title: 'Happy Cake Day, u/testUser!',
        body: '🎂 5 years on cReddit! 🎉'
      },
      tokens: 'validToken'
    })
  })

  test('should send a chat notification when user has a valid FCM token', async () => {
    // Mock UserModel.findOne to return a user with a valid FCM token
    const mockUser = {
      username: 'testUser',
      fcmToken: 'validToken'
    }
    UserModel.findOne = jest.fn().mockResolvedValue(mockUser)

    // Mock NotificationModel.save to resolve successfully
    const notif = {
      save: jest.fn().mockResolvedValue({})
    }
    NotificationModel.mockReturnValue(notif)

    // Mock getMessaging().sendEachForMulticast to resolve successfully
    getMessaging().sendEachForMulticast = jest.fn().mockResolvedValue({ failureCount: 0 })

    // Call the sendNotification function
    await sendNotification('testUser', 'chatMessage', { content: 'testMessage' }, 'notificationFrom')

    // Assert that UserModel.findOne is called with the correct arguments
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser' })

    // Assert that NotificationModel.save is called with the correct arguments
    expect(notif.save).toHaveBeenCalledWith()

    // Assert that getMessaging().sendEachForMulticast is called with the correct arguments
    expect(getMessaging().sendEachForMulticast).toHaveBeenCalledWith({
      notification: {
        title: 'u/notificationFrom',
        body: 'testMessage'
      },
      tokens: 'validToken'
    })
  })

  test('should send a chat request notification when user has a valid FCM token', async () => {
    // Mock UserModel.findOne to return a user with a valid FCM token
    const mockUser = {
      username: 'testUser',
      fcmToken: 'validToken'
    }
    UserModel.findOne = jest.fn().mockResolvedValue(mockUser)

    // Mock NotificationModel.save to resolve successfully
    const notif = {
      save: jest.fn().mockResolvedValue({})
    }
    NotificationModel.mockReturnValue(notif)

    // Mock getMessaging().sendEachForMulticast to resolve successfully
    getMessaging().sendEachForMulticast = jest.fn().mockResolvedValue({ failureCount: 0 })

    // Call the sendNotification function
    await sendNotification('testUser', 'chatRequest', {}, 'notificationFrom')

    // Assert that UserModel.findOne is called with the correct arguments
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser' })

    // Assert that NotificationModel.save is called with the correct arguments
    expect(notif.save).toHaveBeenCalledWith()

    // Assert that getMessaging().sendEachForMulticast is called with the correct arguments
    expect(getMessaging().sendEachForMulticast).toHaveBeenCalledWith({
      notification: {
        title: 'u/notificationFrom added you to a chat room',
        body: 'Tap to view the chat room'
      },
      tokens: 'validToken'
    })
  })

  test('should send a follow notification when user has a valid FCM token', async () => {
    // Mock UserModel.findOne to return a user with a valid FCM token
    const mockUser = {
      username: 'testUser',
      fcmToken: 'validToken'
    }
    UserModel.findOne = jest.fn().mockResolvedValue(mockUser)

    // Mock NotificationModel.save to resolve successfully
    const notif = {
      save: jest.fn().mockResolvedValue({})
    }
    NotificationModel.mockReturnValue(notif)

    // Mock getMessaging().sendEachForMulticast to resolve successfully
    getMessaging().sendEachForMulticast = jest.fn().mockResolvedValue({ failureCount: 0 })

    // Call the sendNotification function
    await sendNotification('testUser', 'follow', {}, 'notificationFrom')

    // Assert that UserModel.findOne is called with the correct arguments
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser' })

    // Assert that NotificationModel.save is called with the correct arguments
    expect(notif.save).toHaveBeenCalledWith()

    // Assert that getMessaging().sendEachForMulticast is called with the correct arguments
    expect(getMessaging().sendEachForMulticast).toHaveBeenCalledWith({
      notification: {
        title: 'u/notificationFrom started following you',
        body: 'Tap to view their profile'
      },
      tokens: 'validToken'
    })
  })

  test('should send a mention notification when user has a valid FCM token', async () => {
    // Mock UserModel.findOne to return a user with a valid FCM token
    const mockUser = {
      username: 'testUser',
      fcmToken: 'validToken'
    }
    UserModel.findOne = jest.fn().mockResolvedValue(mockUser)

    // Mock NotificationModel.save to resolve successfully
    const notif = {
      save: jest.fn().mockResolvedValue({})
    }
    NotificationModel.mockReturnValue(notif)

    // Mock getMessaging().sendEachForMulticast to resolve successfully
    getMessaging().sendEachForMulticast = jest.fn().mockResolvedValue({ failureCount: 0 })

    // Call the sendNotification function
    await sendNotification('testUser', 'mention', { type: 'Post', communityName: 'testCommunity' }, 'notificationFrom', 'postTitle')

    // Assert that UserModel.findOne is called with the correct arguments
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser' })

    // Assert that NotificationModel.save is called with the correct arguments
    expect(notif.save).toHaveBeenCalledWith()

    // Assert that getMessaging().sendEachForMulticast is called with the correct arguments
    expect(getMessaging().sendEachForMulticast).toHaveBeenCalledWith({
      notification: {
        title: 'u/notificationFrom mentioned you in r/testCommunity',
        body: 'Tap to view the mention'
      },
      tokens: 'validToken'
    })
  })

  test('should send a mention notification by another user when user has a valid FCM token', async () => {
    // Mock UserModel.findOne to return a user with a valid FCM token
    const mockUser = {
      username: 'testUser',
      fcmToken: 'validToken'
    }
    UserModel.findOne = jest.fn().mockResolvedValue(mockUser)

    // Mock NotificationModel.save to resolve successfully
    const notif = {
      save: jest.fn().mockResolvedValue({})
    }
    NotificationModel.mockReturnValue(notif)

    // Mock getMessaging().sendEachForMulticast to resolve successfully
    getMessaging().sendEachForMulticast = jest.fn().mockResolvedValue({ failureCount: 0 })

    // Call the sendNotification function
    await sendNotification('testUser', 'mention', { type: 'Post' }, 'notificationFrom', 'postTitle')

    // Assert that UserModel.findOne is called with the correct arguments
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser' })

    // Assert that NotificationModel.save is called with the correct arguments
    expect(notif.save).toHaveBeenCalledWith()

    // Assert that getMessaging().sendEachForMulticast is called with the correct arguments
    expect(getMessaging().sendEachForMulticast).toHaveBeenCalledWith({
      notification: {
        title: 'u/notificationFrom mentioned you',
        body: 'Tap to view the mention'
      },
      tokens: 'validToken'
    })
  })

  test('should send a comment notification when user has a valid FCM token', async () => {
    // Mock UserModel.findOne to return a user with a valid FCM token
    const mockUser = {
      username: 'testUser',
      fcmToken: 'validToken'
    }
    UserModel.findOne = jest.fn().mockResolvedValue(mockUser)

    // Mock NotificationModel.save to resolve successfully
    const notif = {
      save: jest.fn().mockResolvedValue({})
    }
    NotificationModel.mockReturnValue(notif)

    // Mock getMessaging().sendEachForMulticast to resolve successfully
    getMessaging().sendEachForMulticast = jest.fn().mockResolvedValue({ failureCount: 0 })

    // Call the sendNotification function
    await sendNotification('testUser', 'comment', { communityName: 'testCommunity' }, 'notificationFrom', 'postTitle')

    // Assert that UserModel.findOne is called with the correct arguments
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser' })

    // Assert that NotificationModel.save is called with the correct arguments
    expect(notif.save).toHaveBeenCalledWith()

    // Assert that getMessaging().sendEachForMulticast is called with the correct arguments
    expect(getMessaging().sendEachForMulticast).toHaveBeenCalledWith({
      notification: {
        title: 'New comment on your post in r/testCommunity',
        body: 'u/notificationFrom commented on your post'
      },
      tokens: 'validToken'
    })
  })

  test('should send a mention notification when mentioned by another user when user has a valid FCM token', async () => {
    // Mock UserModel.findOne to return a user with a valid FCM token
    const mockUser = {
      username: 'testUser',
      fcmToken: 'validToken'
    }
    UserModel.findOne = jest.fn().mockResolvedValue(mockUser)

    // Mock NotificationModel.save to resolve successfully
    const notif = {
      save: jest.fn().mockResolvedValue({})
    }
    NotificationModel.mockReturnValue(notif)

    // Mock getMessaging().sendEachForMulticast to resolve successfully
    getMessaging().sendEachForMulticast = jest.fn().mockResolvedValue({ failureCount: 0 })

    // Call the sendNotification function
    await sendNotification('testUser', 'mention', { type: 'Post' }, 'notificationFrom', 'postTitle')

    // Assert that UserModel.findOne is called with the correct arguments
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser' })

    // Assert that NotificationModel.save is called with the correct arguments
    expect(notif.save).toHaveBeenCalledWith()

    // Assert that getMessaging().sendEachForMulticast is called with the correct arguments
    expect(getMessaging().sendEachForMulticast).toHaveBeenCalledWith({
      notification: {
        title: 'u/notificationFrom mentioned you',
        body: 'Tap to view the mention'
      },
      tokens: 'validToken'
    })
  })

  test('should send a mention notification when mentioned by another user on a comment when user has a valid FCM token', async () => {
    // Mock UserModel.findOne to return a user with a valid FCM token
    const mockUser = {
      username: 'testUser',
      fcmToken: 'validToken'
    }
    UserModel.findOne = jest.fn().mockResolvedValue(mockUser)

    // Mock NotificationModel.save to resolve successfully
    const notif = {
      save: jest.fn().mockResolvedValue({})
    }
    NotificationModel.mockReturnValue(notif)

    // Mock getMessaging().sendEachForMulticast to resolve successfully
    getMessaging().sendEachForMulticast = jest.fn().mockResolvedValue({ failureCount: 0 })

    // Call the sendNotification function
    await sendNotification('testUser', 'mention', { type: 'Comment', content: 'content' }, 'notificationFrom', 'postTitle')

    // Assert that UserModel.findOne is called with the correct arguments
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser' })

    // Assert that NotificationModel.save is called with the correct arguments
    expect(notif.save).toHaveBeenCalledWith()

    // Assert that getMessaging().sendEachForMulticast is called with the correct arguments
    expect(getMessaging().sendEachForMulticast).toHaveBeenCalledWith({
      notification: {
        title: 'u/notificationFrom commented in "postTitle"',
        body: 'content'
      },
      tokens: 'validToken'
    })
  })

  test('should send a comment notification when user has a valid FCM token', async () => {
    // Mock UserModel.findOne to return a user with a valid FCM token
    const mockUser = {
      username: 'testUser',
      fcmToken: 'validToken'
    }
    UserModel.findOne = jest.fn().mockResolvedValue(mockUser)

    // Mock NotificationModel.save to resolve successfully
    const notif = {
      save: jest.fn().mockResolvedValue({})
    }
    NotificationModel.mockReturnValue(notif)

    // Mock getMessaging().sendEachForMulticast to resolve successfully
    getMessaging().sendEachForMulticast = jest.fn().mockResolvedValue({ failureCount: 0 })

    // Call the sendNotification function
    await sendNotification('testUser', 'comment', { communityName: 'testCommunity' }, 'notificationFrom', 'postTitle')

    // Assert that UserModel.findOne is called with the correct arguments
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser' })

    // Assert that NotificationModel.save is called with the correct arguments
    expect(notif.save).toHaveBeenCalledWith()

    // Assert that getMessaging().sendEachForMulticast is called with the correct arguments
    expect(getMessaging().sendEachForMulticast).toHaveBeenCalledWith({
      notification: {
        title: 'New comment on your post in r/testCommunity',
        body: 'u/notificationFrom commented on your post'
      },
      tokens: 'validToken'
    })
  })

  test('should send a upvoted comment notification when user has a valid FCM token', async () => {
    // Mock UserModel.findOne to return a user with a valid FCM token
    const mockUser = {
      username: 'testUser',
      fcmToken: 'validToken'
    }
    UserModel.findOne = jest.fn().mockResolvedValue(mockUser)

    // Mock NotificationModel.save to resolve successfully
    const notif = {
      save: jest.fn().mockResolvedValue({})
    }
    NotificationModel.mockReturnValue(notif)

    // Mock getMessaging().sendEachForMulticast to resolve successfully
    getMessaging().sendEachForMulticast = jest.fn().mockResolvedValue({ failureCount: 0 })

    // Call the sendNotification function
    await sendNotification('testUser', 'upvotedComment', { communityName: 'testCommunity' }, 'notificationFrom', 'postTitle')

    // Assert that UserModel.findOne is called with the correct arguments
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser' })

    // Assert that NotificationModel.save is called with the correct arguments
    expect(notif.save).toHaveBeenCalledWith()

    // Assert that getMessaging().sendEachForMulticast is called with the correct arguments
    expect(getMessaging().sendEachForMulticast).toHaveBeenCalledWith({
      notification: {
        title: 'u/notificationFrom upvoted your comment in r/testCommunity',
        body: 'Tap to view the comment'
      },
      tokens: 'validToken'
    })
  })

  test('should send a upvoted post notification when user has a valid FCM token', async () => {
    // Mock UserModel.findOne to return a user with a valid FCM token
    const mockUser = {
      username: 'testUser',
      fcmToken: 'validToken'
    }
    UserModel.findOne = jest.fn().mockResolvedValue(mockUser)

    // Mock NotificationModel.save to resolve successfully
    const notif = {
      save: jest.fn().mockResolvedValue({})
    }
    NotificationModel.mockReturnValue(notif)

    // Mock getMessaging().sendEachForMulticast to resolve successfully
    getMessaging().sendEachForMulticast = jest.fn().mockResolvedValue({ failureCount: 0 })

    // Call the sendNotification function
    await sendNotification('testUser', 'upvotedPost', { communityName: 'testCommunity' }, 'notificationFrom', 'postTitle')

    // Assert that UserModel.findOne is called with the correct arguments
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser' })

    // Assert that NotificationModel.save is called with the correct arguments
    expect(notif.save).toHaveBeenCalledWith()

    // Assert that getMessaging().sendEachForMulticast is called with the correct arguments
    expect(getMessaging().sendEachForMulticast).toHaveBeenCalledWith({
      notification: {
        title: 'u/notificationFrom upvoted your post in r/testCommunity',
        body: 'Tap to view the post'
      },
      tokens: 'validToken'
    })
  })

  test('should send a message notification when user has a valid FCM token', async () => {
    // Mock UserModel.findOne to return a user with a valid FCM token
    const mockUser = {
      username: 'testUser',
      fcmToken: 'validToken'
    }
    UserModel.findOne = jest.fn().mockResolvedValue(mockUser)

    // Mock NotificationModel.save to resolve successfully
    const notif = {
      save: jest.fn().mockResolvedValue({})
    }
    NotificationModel.mockReturnValue(notif)

    // Mock getMessaging().sendEachForMulticast to resolve successfully
    getMessaging().sendEachForMulticast = jest.fn().mockResolvedValue({ failureCount: 0 })

    // Call the sendNotification function
    await sendNotification('testUser', 'message', { communityName: 'testCommunity' }, 'notificationFrom', 'postTitle')

    // Assert that UserModel.findOne is called with the correct arguments
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser' })

    // Assert that NotificationModel.save is called with the correct arguments
    expect(notif.save).toHaveBeenCalledWith()

    // Assert that getMessaging().sendEachForMulticast is called with the correct arguments
    expect(getMessaging().sendEachForMulticast).toHaveBeenCalledWith({
      notification: {
        title: 'New message from u/notificationFrom',
        body: 'Tap to view the message'
      },
      tokens: 'validToken'
    })
  })

  test('should send a followed post notification when user has a valid FCM token', async () => {
    // Mock UserModel.findOne to return a user with a valid FCM token
    const mockUser = {
      username: 'testUser',
      fcmToken: 'validToken'
    }
    UserModel.findOne = jest.fn().mockResolvedValue(mockUser)

    // Mock NotificationModel.save to resolve successfully
    const notif = {
      save: jest.fn().mockResolvedValue({})
    }
    NotificationModel.mockReturnValue(notif)

    // Mock getMessaging().sendEachForMulticast to resolve successfully
    getMessaging().sendEachForMulticast = jest.fn().mockResolvedValue({ failureCount: 0 })

    // Call the sendNotification function
    await sendNotification('testUser', 'followedPost', { communityName: 'testCommunity' }, 'notificationFrom', 'postTitle')

    // Assert that UserModel.findOne is called with the correct arguments
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser' })

    // Assert that NotificationModel.save is called with the correct arguments
    expect(notif.save).toHaveBeenCalledWith()

    // Assert that getMessaging().sendEachForMulticast is called with the correct arguments
    expect(getMessaging().sendEachForMulticast).toHaveBeenCalledWith({
      notification: {
        title: 'New activity on a post you follow',
        body: 'Tap to view the post'
      },
      tokens: 'validToken'
    })
  })
})
