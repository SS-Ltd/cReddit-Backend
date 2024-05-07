const UserModel = require('../src/models/User')
const { subscribe } = require('../src/controllers/Notification')
describe('Notification', () => {
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

  it('should successfully subscribe a user with an existing fcmToken', async () => {
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

  it('should return an error when fcmToken is null or undefined', async () => {
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
