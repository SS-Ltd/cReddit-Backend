const UserModel = require('../src/models/User')
const dotenv = require('dotenv')
const { follow, unfollow, block, unblock, isUsernameAvailable, forgotPassword, forgotUsername, resetPassword, changePassword, changeEmail } = require('../src/controllers/User')

dotenv.config()

jest.mock('../src/models/User', () => ({
  findOne: jest.fn()
}))

describe('follow', () => {
  beforeEach(() => {
    UserModel.findOne.mockClear()
  })

  test('should return a bad request error when username is not provided', async () => {
    const req = {
      params: {}
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    await follow(req, res)

    expect(UserModel.findOne).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      status: 'Bad Request',
      message: 'Username is required'
    })
  })

  test('should follow user when user is authenticated and exists', async () => {
    const req = {
      params: {
        username: 'user2'
      },
      decoded: {
        username: 'user1'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const user2 = {
      username: 'user2',
      followers: [],
      save: jest.fn()
    }

    const user = {
      username: 'user1',
      follows: [],
      save: jest.fn()
    }

    UserModel.findOne.mockResolvedValueOnce(user)
    UserModel.findOne.mockResolvedValueOnce(user2)

    await follow(req, res)

    expect(UserModel.findOne).toHaveBeenCalledTimes(2)
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'user1', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'user2', isDeleted: false })
    expect(user.follows).toContain('user2')
    expect(user2.followers).toContain('user1')
    expect(user.save).toHaveBeenCalled()
    expect(user2.save).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      status: 'OK',
      message: 'User followed'
    })
  })

  test('should return a bad request error when user already follows the user', async () => {
    const req = {
      params: {
        username: 'user2'
      },
      decoded: {
        username: 'user1'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const user1 = {
      username: 'user1',
      follows: ['user2']
    }

    const user2 = {
      username: 'user2',
      followers: ['user1']
    }

    UserModel.findOne = jest.fn()
      .mockResolvedValueOnce(user1)
      .mockResolvedValueOnce(user2)

    await follow(req, res)

    expect(UserModel.findOne).toHaveBeenCalledTimes(2)
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'user1', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'user2', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      status: 'Bad Request',
      message: 'User already follows the user'
    })
  })

  test('should return an error message when user attempts to follow themselves', async () => {
    const req = {
      params: {
        username: 'user1'
      },
      decoded: {
        username: 'user1'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const user1 = {
      username: 'user1',
      follows: []
    }

    UserModel.findOne = jest.fn().mockResolvedValue(user1)

    await follow(req, res)

    expect(UserModel.findOne).toHaveBeenCalledTimes(2)
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'user1', isDeleted: false })
    expect(user1.follows).not.toContain('user1')
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      status: 'Bad Request',
      message: 'User cannot follow themselves'
    })
  })

  test('should return user does not exist error when user is not found', async () => {
    const req = {
      params: {
        username: 'user2'
      },
      decoded: {
        username: 'user1'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    UserModel.findOne = jest.fn().mockResolvedValueOnce(null)

    await follow(req, res)

    expect(UserModel.findOne).toHaveBeenCalledTimes(1)
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'user1', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      status: 'Not Found',
      message: 'User does not exist'
    })
  })

  test('should return an error message when attempting to follow a non-existent user', async () => {
    const req = {
      params: {
        username: 'nonexistentuser'
      },
      decoded: {
        username: 'user1'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const user1 = {
      username: 'user1'
    }

    UserModel.findOne = jest.fn().mockResolvedValueOnce(user1).mockResolvedValueOnce(null)

    await follow(req, res)

    expect(UserModel.findOne).toHaveBeenCalledTimes(2)
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'user1', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'nonexistentuser', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      status: 'Not Found',
      message: 'User to be followed does not exist'
    })
  })

  test('should return an error message when attempting to follow a deleted user', async () => {
    const req = {
      params: {
        username: 'deleteduser'
      },
      decoded: {
        username: 'user1'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const user1 = {
      username: 'user1'
    }

    UserModel.findOne = jest.fn().mockResolvedValueOnce(user1).mockResolvedValueOnce(null)

    await follow(req, res)

    expect(UserModel.findOne).toHaveBeenCalledTimes(2)
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'user1', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'deleteduser', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      status: 'Not Found',
      message: 'User to be followed does not exist'
    })
  })
})

describe('unfollow', () => {
  beforeEach(() => {
    UserModel.findOne.mockClear()
  })

  test('should return a bad request error when username is not provided', async () => {
    const req = {
      params: {}
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    await unfollow(req, res)

    expect(UserModel.findOne).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      status: 'Bad Request',
      message: 'Username is required'
    })
  })

  test('should successfully unfollow a user when all parameters are valid', async () => {
    const req = {
      params: {
        username: 'user2'
      },
      decoded: {
        username: 'user1'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const user = {
      username: 'user1',
      follows: ['user2'],
      save: jest.fn()
    }

    const userUnfollowed = {
      username: 'user2',
      followers: ['user1'],
      save: jest.fn()
    }

    UserModel.findOne.mockResolvedValueOnce(user)
    UserModel.findOne.mockResolvedValueOnce(userUnfollowed)

    await unfollow(req, res)

    expect(UserModel.findOne).toHaveBeenCalledTimes(2)
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'user1', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'user2', isDeleted: false })
    expect(user.follows).not.toContain('user2')
    expect(userUnfollowed.followers).not.toContain('user1')
    expect(user.save).toHaveBeenCalled()
    expect(userUnfollowed.save).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      status: 'OK',
      message: 'User unfollowed'
    })
  })

  test('should return a 404 error when the user does not exist', async () => {
    const req = {
      params: {
        username: 'user2'
      },
      decoded: {
        username: 'user1'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    UserModel.findOne.mockResolvedValueOnce(null)

    await unfollow(req, res)

    expect(UserModel.findOne).toHaveBeenCalledTimes(1)
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'user1', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      status: 'Not Found',
      message: 'User does not exist'
    })
  })

  test('should return a 404 error when the user to unfollow does not exist', async () => {
    const req = {
      params: {
        username: 'nonexistentuser'
      },
      decoded: {
        username: 'user1'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const user = {
      username: 'user1',
      follows: ['user2'],
      save: jest.fn()
    }

    UserModel.findOne.mockResolvedValueOnce(user)
    UserModel.findOne.mockResolvedValueOnce(null)

    await unfollow(req, res)

    expect(UserModel.findOne).toHaveBeenCalledTimes(2)
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'user1', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'nonexistentuser', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      status: 'Not Found',
      message: 'User to be unfollowed does not exist'
    })
  })

  test('should return a 400 error when the user tries to unfollow themselves', async () => {
    const req = {
      params: {
        username: 'user1'
      },
      decoded: {
        username: 'user1'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const user = {
      username: 'user1',
      follows: ['user2'],
      save: jest.fn()
    }

    UserModel.findOne.mockResolvedValue(user)

    await unfollow(req, res)

    expect(UserModel.findOne).toHaveBeenCalledTimes(2)
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'user1', isDeleted: false })
    expect(user.follows).not.toContain('user1')
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      status: 'Bad Request',
      message: 'User cannot unfollow themselves'
    })
  })
})

describe('block', () => {
  beforeEach(() => {
    UserModel.findOne.mockClear()
  })

  test('should return a bad request error when username is not provided', async () => {
    const req = {
      params: {}
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    await block(req, res)

    expect(UserModel.findOne).not.toHaveBeenCalled()

    expect(UserModel.findOne).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      status: 'Bad Request',
      message: 'Username is required'
    })
  })

  test('should block a valid user successfully', async () => {
    const req = {
      params: {
        username: 'user2'
      },
      decoded: {
        username: 'user1'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const user = {
      username: 'user1',
      blockedUsers: [],
      save: jest.fn()
    }

    const userBlocked = {
      username: 'user2'
    }

    UserModel.findOne.mockResolvedValueOnce(user)
    UserModel.findOne.mockResolvedValueOnce(userBlocked)

    await block(req, res)

    expect(UserModel.findOne).toHaveBeenCalledTimes(2)
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'user1', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'user2', isDeleted: false })
    expect(user.blockedUsers).toContain('user2')
    expect(user.save).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      status: 'OK',
      message: 'User blocked'
    })
  })

  test('should return a 404 error if the user to be blocked does not exist', async () => {
    const req = {
      params: {
        username: 'nonexistentuser'
      },
      decoded: {
        username: 'user1'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const user = {
      username: 'user1',
      blockedUsers: [],
      save: jest.fn()
    }

    UserModel.findOne.mockResolvedValueOnce(user)
    UserModel.findOne.mockResolvedValueOnce(null)

    await block(req, res)

    expect(UserModel.findOne).toHaveBeenCalledTimes(2)
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'user1', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'nonexistentuser', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      status: 'Not Found',
      message: 'User to be blocked does not exist'
    })
  })

  test('should return a 404 error if the current user does not exist', async () => {
    const req = {
      params: {
        username: 'user2'
      },
      decoded: {
        username: 'user1'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    UserModel.findOne.mockResolvedValueOnce(null)

    await block(req, res)

    expect(UserModel.findOne).toHaveBeenCalledTimes(1)
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'user1', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      status: 'Not Found',
      message: 'User does not exist'
    })
  })

  test('should return a 400 error when user tries to block themselves', async () => {
    const req = {
      params: {
        username: 'user1'
      },
      decoded: {
        username: 'user1'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const user = {
      username: 'user1',
      blockedUsers: [],
      save: jest.fn()
    }

    UserModel.findOne.mockResolvedValue(user)

    await block(req, res)

    expect(UserModel.findOne).toHaveBeenCalledTimes(2)
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'user1', isDeleted: false })
    expect(user.blockedUsers).not.toContain('user1')
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      status: 'Bad Request',
      message: 'User cannot block themselves'
    })
  })

  test('should return a 400 error if the user already blocks the user to be blocked', async () => {
    const req = {
      params: {
        username: 'user2'
      },
      decoded: {
        username: 'user1'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const user = {
      username: 'use1',
      blockedUsers: ['user2'],
      save: jest.fn()
    }

    const userBlocked = {
      username: 'user2'
    }

    UserModel.findOne.mockResolvedValueOnce(user)
    UserModel.findOne.mockResolvedValueOnce(userBlocked)

    await block(req, res)

    expect(UserModel.findOne).toHaveBeenCalledTimes(2)
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'user1', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'user2', isDeleted: false })
    expect(user.save).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      status: 'Bad Request',
      message: 'User already blocks the user'
    })
  })
})

describe('unblock', () => {
  beforeEach(() => {
    UserModel.findOne.mockClear()
  })

  test('should return a bad request error when username is not provided', async () => {
    const req = {
      params: {}
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    await unblock(req, res)

    expect(UserModel.findOne).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      status: 'Bad Request',
      message: 'Username is required'
    })
  })

  test('should unblock a user when they are blocked', async () => {
    const req = {
      params: {
        username: 'user2'
      },
      decoded: {
        username: 'user1'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const user = {
      username: 'user1',
      blockedUsers: ['user2'],
      save: jest.fn()
    }

    const userUnblocked = {
      username: 'user2'
    }

    UserModel.findOne.mockResolvedValueOnce(user)
    UserModel.findOne.mockResolvedValueOnce(userUnblocked)

    await unblock(req, res)

    expect(UserModel.findOne).toHaveBeenCalledTimes(2)
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'user1', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'user2', isDeleted: false })
    expect(user.blockedUsers).not.toContain('user2')
    expect(user.save).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      status: 'OK',
      message: 'User unblocked'
    })
  })

  test('should return a 404 error when the user does not exist', async () => {
    const req = {
      params: {
        username: 'user2'
      },
      decoded: {
        username: 'user1'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    UserModel.findOne.mockResolvedValueOnce(null)

    await unblock(req, res)

    expect(UserModel.findOne).toHaveBeenCalledTimes(1)
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'user1', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      status: 'Not Found',
      message: 'User does not exist'
    })
  })

  test('should return a 404 error when the user to be unblocked does not exist', async () => {
    const req = {
      params: {
        username: 'nonexistentUser'
      },
      decoded: {
        username: 'user1'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const user = {
      username: 'user1',
      blockedUsers: ['user2']
    }

    UserModel.findOne.mockResolvedValueOnce(user)
    UserModel.findOne.mockResolvedValueOnce(null)

    await unblock(req, res)

    expect(UserModel.findOne).toHaveBeenCalledTimes(2)
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'user1', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'nonexistentUser', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      status: 'Not Found',
      message: 'User to be unblocked does not exist'
    })
  })

  test('should return a 400 error when the user tries to unblock themselves', async () => {
    const req = {
      params: {
        username: 'user1'
      },
      decoded: {
        username: 'user1'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const user = {
      username: 'user1',
      blockedUsers: ['user2']
    }

    UserModel.findOne.mockResolvedValue(user)

    await unblock(req, res)

    expect(UserModel.findOne).toHaveBeenCalledTimes(2)
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'user1', isDeleted: false })
    expect(user.blockedUsers).toContain('user2')
    expect(user.blockedUsers).not.toContain('user1')
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      status: 'Bad Request',
      message: 'User cannot unblock themselves'
    })
  })
})

describe('isUsernameAvailable', () => {
  beforeEach(() => {
    UserModel.findOne.mockClear()
  })

  test('should return 400 status code and message when username is not provided', async () => {
    const req = {
      params: {}
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    await isUsernameAvailable(req, res)

    expect(UserModel.findOne).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      status: 'Bad Request',
      message: 'Username is required'
    })
  })

  test('should return 200 status code and message when username is available', async () => {
    const req = {
      params: {
        username: 'testuser'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    UserModel.findOne = jest.fn().mockResolvedValue(null)

    await isUsernameAvailable(req, res)

    expect(UserModel.findOne).toHaveBeenCalledTimes(1)
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testuser' })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      status: 'OK',
      message: 'Username is available',
      available: true
    })
  })

  test('should return 409 status code and message when username is not available', async () => {
    const req = {
      params: {
        username: 'testuser'
      }
    }

    const user = {
      username: 'testuser'
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    UserModel.findOne = jest.fn().mockResolvedValue(user)

    await isUsernameAvailable(req, res)

    expect(UserModel.findOne).toHaveBeenCalledTimes(1)
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testuser' })
    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith({
      status: 'Conflict',
      message: 'Username is not available',
      available: false
    })
  })
})
// jest.mock('../src/utils/Email', () => jest.fn())
jest.mock('../src/utils/Email', () => {
  return jest.fn()
})
const sendEmail = require('../src/utils/Email')
const bcrypt = require('bcrypt')

afterEach(() => {
  jest.restoreAllMocks()
})

// test('should generate a 64 character reset token', async () => {
//   const user = new UserModel()
//   const resetToken = await user.createResetPasswordToken()
//   console.log(resetToken)
//   expect(resetToken.length).toBe(64)
// })

// test('should throw an error when bcrypt.genSalt throws an error', async () => {
//   const user = new UserModel()
//   jest.spyOn(bcrypt, 'genSalt').mockRejectedValue(new Error('bcrypt.genSalt error'))
//   await expect(user.createResetPasswordToken()).rejects.toThrow('bcrypt.genSalt error')
// })

describe('forgotPassword', () => {
  // Successfully find user by username and email, generate reset token, send email, and return success message
  test('should find user by username and email, generate reset token, send email, and return success message', async () => {
    const req = {
      body: {
        username: 'testuser',
        email: 'testuser@example.com'
      },
      protocol: 'http',
      get: jest.fn().mockReturnValue('localhost')
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const user = {
      username: 'testuser',
      email: 'testuser@example.com',
      isDeleted: false,
      createResetPasswordToken: jest.fn().mockReturnValue('resetToken'),
      save: jest.fn()
    }

    UserModel.findOne = jest.fn().mockResolvedValue(user)
    // sendEmail.mockImplementation(() => Promise.resolve())
    sendEmail.mockResolvedValue()

    await forgotPassword(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testuser', email: 'testuser@example.com', isDeleted: false })
    expect(user.createResetPasswordToken).toHaveBeenCalled()
    expect(user.save).toHaveBeenCalled()
    expect(sendEmail).toHaveBeenCalledWith({
      email: 'testuser@example.com',
      subject: 'Ask and you shall receive a password reset',
      message: expect.any(String)
    })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: 'Reset password has been sent to the user successfully' })
  })

  test('should return error message and error object when user is not found', async () => {
    const req = {
      body: {
        username: 'testuser',
        email: 'testuser@example.com'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    UserModel.findOne = jest.fn().mockResolvedValue(null)

    await forgotPassword(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testuser', email: 'testuser@example.com', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ message: 'Username or Email not found' })
  })

  // Successfully find user by username and email, generate reset token, fail to send email, delete reset token, and return error message
  test('should return error message when fail to send email', async () => {
    const req = {
      body: {
        username: 'testuser',
        email: 'testuser@example.com'
      },
      protocol: 'http',
      get: jest.fn().mockReturnValue('localhost')
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const user = {
      createResetPasswordToken: jest.fn().mockReturnValue('resetToken'),
      save: jest.fn()
    }

    UserModel.findOne = jest.fn().mockResolvedValue(user)

    sendEmail.mockRejectedValue(new Error('Failed to send email'))

    await forgotPassword(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testuser', email: 'testuser@example.com', isDeleted: false })
    expect(user.createResetPasswordToken).toHaveBeenCalled()
    expect(user.save).toHaveBeenCalled()
    expect(sendEmail).toHaveBeenCalledWith({
      email: 'testuser@example.com',
      subject: 'Ask and you shall receive a password reset',
      message: expect.any(String)
    })
    expect(user.passwordResetToken).toBeUndefined()
    expect(user.resetPasswordTokenExpire).toBeUndefined()
    expect(user.save).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ message: 'There was an error sending the email. Try again later' })
  })

  test('should fail to delete reset token and return error message when failing to send email', async () => {
    const req = {
      body: {
        username: 'testuser',
        email: 'testuser@example.com'
      },
      protocol: 'http',
      get: jest.fn().mockReturnValue('localhost')
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const user = {
      createResetPasswordToken: jest.fn().mockReturnValue('resetToken'),
      save: jest.fn()
    }

    UserModel.findOne = jest.fn().mockResolvedValue(user)

    sendEmail.mockRejectedValue(new Error('Failed to send email'))

    await forgotPassword(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testuser', email: 'testuser@example.com', isDeleted: false })
    expect(user.createResetPasswordToken).toHaveBeenCalled()
    expect(user.save).toHaveBeenCalled()
    expect(sendEmail).toHaveBeenCalledWith({
      email: 'testuser@example.com',
      subject: 'Ask and you shall receive a password reset',
      message: expect.any(String)
    })
    expect(user.passwordResetToken).toBeUndefined()
    expect(user.resetPasswordTokenExpire).toBeUndefined()
    expect(user.save).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ message: 'There was an error sending the email. Try again later' })
  })

  test('should fail to send email due to invalid email address, delete reset token, and return error message', async () => {
    const req = {
      body: {
        username: 'testuser',
        email: 'testuser@example.com'
      },
      protocol: 'http',
      get: jest.fn().mockReturnValue('localhost')
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const user = {
      createResetPasswordToken: jest.fn().mockReturnValue('resetToken'),
      save: jest.fn()
    }

    UserModel.findOne = jest.fn().mockResolvedValue(user)

    sendEmail.mockRejectedValue(new Error('Invalid email address'))

    await forgotPassword(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testuser', email: 'testuser@example.com', isDeleted: false })
    expect(user.createResetPasswordToken).toHaveBeenCalled()
    expect(user.save).toHaveBeenCalled()
    expect(sendEmail).toHaveBeenCalledWith({
      email: 'testuser@example.com',
      subject: 'Ask and you shall receive a password reset',
      message: expect.any(String)
    })
    expect(user.passwordResetToken).toBeUndefined()
    expect(user.resetPasswordTokenExpire).toBeUndefined()
    expect(user.save).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ message: 'There was an error sending the email. Try again later' })
  })

  test('should send email with correct subject and message format', async () => {
    const req = {
      body: {
        username: 'testuser',
        email: 'testuser@example.com'
      },
      protocol: 'http',
      get: jest.fn().mockReturnValue('localhost')
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const user = {
      createResetPasswordToken: jest.fn().mockReturnValue('resetToken'),
      save: jest.fn()
    }

    UserModel.findOne = jest.fn().mockResolvedValue(user)

    sendEmail.mockResolvedValue()

    await forgotPassword(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testuser', email: 'testuser@example.com', isDeleted: false })
    expect(user.createResetPasswordToken).toHaveBeenCalled()
    expect(user.save).toHaveBeenCalled()
    expect(sendEmail).toHaveBeenCalledWith({
      email: 'testuser@example.com',
      subject: 'Ask and you shall receive a password reset',
      message: expect.any(String)
    })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: 'Reset password has been sent to the user successfully' })
  })
})

// // ////////////////////////// Reset password test ////////////////////
describe('resetPassword', () => {
  test('should retrieve user based on valid token and reset password successfully', async () => {
    const req = {
      params: {
        token: 'validToken'
      },
      body: {
        password: 'newPassword1',
        confirmPassword: 'newPassword1'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const user = {
      resetPasswordTokenExpire: Date.now() + 3600000,
      resetPasswordToken: 'hashedToken',
      save: jest.fn()
    }

    UserModel.findOne = jest.fn().mockResolvedValue(user)
    bcrypt.compare = jest.fn().mockResolvedValue(true)
    bcrypt.hash = jest.fn().mockResolvedValue('hashedPassword')

    await resetPassword(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ resetPasswordTokenExpire: { $gt: expect.any(Number) }, isDeleted: false })
    expect(bcrypt.compare).toHaveBeenCalledWith('validToken', 'hashedToken')
    expect(user.password).toBe('hashedPassword')
    expect(user.passwordChangedAt).toBeTruthy()
    expect(user.resetPasswordToken).toBeUndefined()
    expect(user.resetPasswordTokenExpire).toBeUndefined()
    expect(user.save).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: 'Password has been reset successfully' })
  })

  test('should return an error message when token has expired', async () => {
    const req = {
      params: {
        token: 'expiredToken'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    UserModel.findOne = jest.fn().mockResolvedValue(null)

    await resetPassword(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ resetPasswordTokenExpire: { $gt: expect.any(Number) }, isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Token has expired' })
  })

  test('should return error message when passwords do not match', async () => {
    const req = {
      params: {
        token: 'validToken'
      },
      body: {
        password: 'newPassword',
        confirmPassword: 'differentPassword'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const user = {
      resetPasswordTokenExpire: Date.now() + 3600000,
      resetPasswordToken: 'hashedToken',
      save: jest.fn()
    }

    UserModel.findOne = jest.fn().mockResolvedValue(user)

    await resetPassword(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ resetPasswordTokenExpire: { $gt: expect.any(Number) }, isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Passwords do not match' })
  })

  test('should return an error message when token is invalid', async () => {
    const req = {
      params: {
        token: 'invalidToken'
      },
      body: {
        password: 'newPassword',
        confirmPassword: 'newPassword'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const user = {
      resetPasswordTokenExpire: Date.now() + 3600000,
      resetPasswordToken: 'hashedToken',
      save: jest.fn()
    }

    UserModel.findOne = jest.fn().mockResolvedValue(user)
    bcrypt.compare = jest.fn().mockResolvedValue(false)

    await resetPassword(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ resetPasswordTokenExpire: { $gt: expect.any(Number) }, isDeleted: false })
    expect(bcrypt.compare).toHaveBeenCalledWith('invalidToken', 'hashedToken')
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Token is invalid' })
  })
})
// // ////////////////////////// Forgot username test ////////////////////
describe('forgotUsername', () => {
  test('should return 404 status and error message when request body is empty', async () => {
    const req = {
      body: {}
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    UserModel.findOne = jest.fn()

    await forgotUsername(req, res)

    expect(UserModel.findOne).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ message: 'Email is required' })
  })

  test('should send email to user with their username', async () => {
    const req = { body: { email: 'test@example.com' } }
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
    const user = { email: 'test@example.com', username: 'testuser' }
    UserModel.findOne = jest.fn().mockResolvedValue(user)

    sendEmail.mockResolvedValue()

    await forgotUsername(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com', isDeleted: false })
    expect(sendEmail).toHaveBeenCalledWith({ email: 'test@example.com', subject: 'So you wanna know your Reddit username, huh?', message: `Hey there,\n\nYou forgot it didn't you? No worries. Here you go:\n\nYour username is: ${user.username}\n\n(Username checks out, nicely done.)\n\nIf you didn't forget your username, please ignore this email!` })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: 'Username has been sent to the user successfully' })
  })

  test('should handle error while sending email to user', async () => {
    const req = { body: { email: 'test@example.com' } }
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
    const user = { email: 'test@example.com', username: 'testuser' }
    UserModel.findOne = jest.fn().mockResolvedValue(user)
    sendEmail.mockRejectedValue(new Error('Failed to send email'))

    await forgotUsername(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com', isDeleted: false })
    expect(sendEmail).toHaveBeenCalledWith({ email: 'test@example.com', subject: 'So you wanna know your Reddit username, huh?', message: `Hey there,\n\nYou forgot it didn't you? No worries. Here you go:\n\nYour username is: ${user.username}\n\n(Username checks out, nicely done.)\n\nIf you didn't forget your username, please ignore this email!` })
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ message: 'There was an error sending the email. Try again later' })
  })

  test('should return an error message when user does not exist with provided email', async () => {
    const req = { body: { email: 'nonexistent@example.com' } }
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
    UserModel.findOne = jest.fn().mockResolvedValue(null)

    await forgotUsername(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ email: 'nonexistent@example.com', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ message: 'Email not found' })
  })
})

// ///////////////////////////////////////// Change password test //////////////////////////
describe('changePassword', () => {
  test('should change password when all inputs are valid', async () => {
    const req = {
      body: {
        oldPassword: 'oldPassword',
        newPassword: 'newPassword1',
        confirmPassword: 'newPassword1'
      },
      decoded: {
        username: 'testUser'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const user = {
      username: 'testUser',
      password: 'oldPassword',
      isDeleted: false,
      save: jest.fn()
    }

    const findOneMock = jest.spyOn(UserModel, 'findOne').mockResolvedValue(user)
    const compareMock = jest.spyOn(bcrypt, 'compare').mockResolvedValue(true)
    const hashMock = jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword')

    await changePassword(req, res)

    expect(findOneMock).toHaveBeenCalledWith({ username: 'testUser', isDeleted: false })
    expect(compareMock).toHaveBeenCalledWith('oldPassword', 'oldPassword')
    expect(hashMock).toHaveBeenCalledWith('newPassword1', expect.any(String))
    expect(user.password).toBe('hashedPassword')
    expect(user.passwordChangedAt).toBeDefined()
    expect(user.save).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: 'Password has been changed successfully' })
  })

  test('should return 400 status and error message when old password is empty', async () => {
    const req = {
      body: {
        oldPassword: '',
        newPassword: 'newPassword1',
        confirmPassword: 'newPassword1'
      },
      decoded: {
        username: 'testUser'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    await changePassword(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Old password, new password and confirm password are required' })
  })

  test('should change password when all inputs are valid and password contains special characters', async () => {
    const req = {
      body: {
        oldPassword: 'oldPassword',
        newPassword: 'newPassword@123',
        confirmPassword: 'newPassword@123'
      },
      decoded: {
        username: 'testUser'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const user = {
      username: 'testUser',
      password: 'oldPassword',
      isDeleted: false,
      save: jest.fn()
    }

    const findOneMock = jest.spyOn(UserModel, 'findOne').mockResolvedValue(user)
    const compareMock = jest.spyOn(bcrypt, 'compare').mockResolvedValue(true)
    const hashMock = jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword')

    await changePassword(req, res)

    expect(findOneMock).toHaveBeenCalledWith({ username: 'testUser', isDeleted: false })
    expect(compareMock).toHaveBeenCalledWith('oldPassword', 'oldPassword')
    expect(hashMock).toHaveBeenCalledWith('newPassword@123', expect.any(String))
    expect(user.password).toBe('hashedPassword')
    expect(user.passwordChangedAt).toBeDefined()
    expect(user.save).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: 'Password has been changed successfully' })
  })

  test('should change password when all inputs are valid and password contains spaces', async () => {
    const req = {
      body: {
        oldPassword: 'oldPassword',
        newPassword: 'new Password 123',
        confirmPassword: 'new Password 123'
      },
      decoded: {
        username: 'testUser'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const user = {
      username: 'testUser',
      password: 'oldPassword',
      isDeleted: false,
      save: jest.fn()
    }

    const findOneMock = jest.spyOn(UserModel, 'findOne').mockResolvedValue(user)
    const compareMock = jest.spyOn(bcrypt, 'compare').mockResolvedValue(true)
    const hashMock = jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword')

    await changePassword(req, res)

    expect(findOneMock).toHaveBeenCalledWith({ username: 'testUser', isDeleted: false })
    expect(compareMock).toHaveBeenCalledWith('oldPassword', 'oldPassword')
    expect(hashMock).toHaveBeenCalledWith('new Password 123', expect.any(String))
    expect(user.password).toBe('hashedPassword')
    expect(user.passwordChangedAt).toBeDefined()
    expect(user.save).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: 'Password has been changed successfully' })
  })
})

// ///////////////////////////////////////// Change email test //////////////////////////
describe('changeEmail', () => {
  test('should change email successfully when valid password and new email are provided', async () => {
    const req = {
      body: {
        password: 'password123',
        newEmail: 'newemail@example.com'
      },
      decoded: {
        username: 'testuser'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const user = {
      username: 'testuser',
      password: await bcrypt.hash('password123', 10),
      email: 'oldemail@example.com',
      isDeleted: false,
      save: jest.fn()
    }

    UserModel.findOne = jest.fn().mockResolvedValue(user)

    await changeEmail(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testuser', isDeleted: false })
    expect(bcrypt.compare).toHaveBeenCalledWith('password123', user.password)
    expect(user.email).toBe('newemail@example.com')
    expect(user.save).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: 'Email has been changed successfully' })
  })

  test('should return error message when password is missing', async () => {
    const req = {
      body: {
        newEmail: 'newemail@example.com'
      },
      decoded: {
        username: 'testuser'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    await changeEmail(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Password and new email are required' })
  })
  test('should change email successfully when valid password and email containing maximum length characters are provided', async () => {
    const req = {
      body: {
        password: 'password123',
        newEmail: 'a'.repeat(320) + '@example.com'
      },
      decoded: {
        username: 'testuser'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const user = {
      username: 'testuser',
      password: '$2b$10$3X6Zz0Q9J6X8Zz0Q9J6X8Zz0Q9J6X8Zz0Q9J6X8Zz0Q9J6X8Zz0Q9J6',
      email: 'oldemail@example.com',
      save: jest.fn()
    }

    UserModel.findOne = jest.fn().mockResolvedValue(user)
    bcrypt.compare = jest.fn().mockResolvedValue(true)

    await changeEmail(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testuser', isDeleted: false })
    expect(bcrypt.compare).toHaveBeenCalledWith('password123', '$2b$10$3X6Zz0Q9J6X8Zz0Q9J6X8Zz0Q9J6X8Zz0Q9J6X8Zz0Q9J6X8Zz0Q9J6')
    expect(user.email).toBe('a'.repeat(320) + '@example.com')
    expect(user.save).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: 'Email has been changed successfully' })
  })
})
