const UserModel = require('../src/models/User')
const NotificationModel = require('../src/models/Notification')
const { subscribe, unsubscribe, getNotifications } = require('../src/controllers/Notification')
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

jest.mock('../src/models/Notification', () => {
  return {
    getNotifications: jest.fn().mockResolvedValue(notifications)
  }
})

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

    NotificationModel.getNotifications.mockRejectedValue(new Error('Error retrieving notifications'))

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
