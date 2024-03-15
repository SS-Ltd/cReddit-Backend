const UserModel = require('../src/models/User')
const dotenv = require('dotenv')
const { follow, unfollow, block, unblock, isUsernameAvailable } = require('../src/controllers/User')

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
