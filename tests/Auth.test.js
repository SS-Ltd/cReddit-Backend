const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { createUser, deleteUser, login, logout, verifyUser } = require('../src/controllers/Auth')
const { refreshToken } = require('../src/controllers/JWT')
const User = require('../src/models/User')

describe('createUser', () => {
  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/test')
    await User.deleteMany({})
  })

  afterAll(async () => {
    await mongoose.disconnect()
  })

  test('should create a new user when all fields are provided', async () => {
    const req = {
      body: {
        username: 'testuser',
        password: 'TestPassword123',
        email: 'nejocov739@fryshare.com',
        gender: 'None'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn()
    }

    await createUser(req, res)

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'User created successfully' }))
    expect(res.status).toHaveBeenCalledWith(201)
  })

  test('should throw an error when trying to create a user with existing username', async () => {
    const req = {
      body: {
        username: 'testuser',
        password: 'TestPassword123',
        email: 'test1@example.com',
        gender: 'None'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    await createUser(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Username or email already exist' })
  })

  test('should throw an error when trying to create a user with existing email', async () => {
    const req = {
      body: {
        username: 'testuser1',
        password: 'TestPassword123',
        email: 'nejocov739@fryshare.com',
        gender: 'None'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    await createUser(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Username or email already exist' })
  })

  test('should throw an error when username is missing', async () => {
    const req = {
      body: {
        password: 'TestPassword123',
        email: 'test1@example.com',
        gender: 'None'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    await createUser(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Username, password, email and gender are required' })
  })

  test('should throw an error when gender is invalid', async () => {
    const req = {
      body: {
        username: 'testuser1',
        password: 'TestPassword123',
        email: 'test1@example.com',
        gender: 'male'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    await createUser(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid gender' })
  })

  test('should throw an error when password is less than 8 characters', async () => {
    const req = {
      body: {
        username: 'testuser1',
        password: 'test',
        email: 'test1@example.com',
        gender: 'None'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    await createUser(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Password must contain at least one lower and upper case letters and at least one digit and must be at least 8 characters' })
  })
})

describe('deleteUser', () => {
  test('should delete user when user exists', async () => {
    const req = {
      decoded: {
        username: 'testUser'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    const findOneMock = jest.spyOn(User, 'findOne').mockResolvedValueOnce({ username: 'testUser' })
    const updateOneMock = jest.spyOn(User, 'updateOne').mockResolvedValueOnce()

    await deleteUser(req, res)

    expect(findOneMock).toHaveBeenCalledWith({ username: 'testUser', isDeleted: false })
    expect(updateOneMock).toHaveBeenCalledWith({ username: 'testUser' }, { $set: { isDeleted: true } })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: 'User deleted successfully' })
  })

  test('should return 404 when user does not exist', async () => {
    const req = {
      decoded: {
        username: 'nonExistingUser'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    const findOneMock = jest.spyOn(User, 'findOne').mockResolvedValueOnce(null)

    await deleteUser(req, res)

    expect(findOneMock).toHaveBeenCalledWith({ username: 'nonExistingUser', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' })
  })
})

describe('login', () => {
  test('should login successfully when provided with valid username and password', async () => {
    const req = {
      body: {
        username: 'validUsername',
        password: 'validPassword'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn()
    }
    const user = {
      username: 'validUsername',
      password: 'hashedPassword'
    }
    User.findOne = jest.fn().mockResolvedValue(user)
    bcrypt.compare = jest.fn().mockResolvedValue(true)
    jwt.sign = jest.fn().mockReturnValueOnce('accessToken').mockReturnValueOnce('refreshToken')
    User.updateOne = jest.fn()

    await login(req, res)

    expect(User.findOne).toHaveBeenCalledWith({ username: 'validUsername', isDeleted: false })
    expect(bcrypt.compare).toHaveBeenCalledWith('validPassword', 'hashedPassword')
    expect(jwt.sign).toHaveBeenCalledWith({ username: 'validUsername' }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10m' })
    expect(jwt.sign).toHaveBeenCalledWith({ username: 'validUsername' }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '1d' })
    expect(User.updateOne).toHaveBeenCalledWith({ username: 'validUsername' }, { $set: { refreshToken: 'refreshToken' } })
    expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'refreshToken', {
      httpOnly: true,
      sameSite: 'None',
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
      path: '/user/refresh-token'
    })
    expect(res.cookie).toHaveBeenCalledWith('accessToken', 'accessToken', {
      httpOnly: true,
      sameSite: 'None',
      secure: true,
      maxAge: 24 * 60 * 60 * 1000
    })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'User logged in successfully' }))
  })

  test('should throw an error when username is empty', async () => {
    const req = {
      body: {
        username: '',
        password: 'validPassword'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    await login(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Username and password are required' })
  })

  test('should throw an error when invalid password is provided', async () => {
    const req = {
      body: {
        username: 'validUsername',
        password: 'invalidPassword'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    const user = {
      username: 'validUsername',
      password: 'hashedPassword'
    }
    User.findOne = jest.fn().mockResolvedValue(user)
    bcrypt.compare = jest.fn().mockResolvedValue(false)

    await login(req, res)

    expect(User.findOne).toHaveBeenCalledWith({ username: 'validUsername', isDeleted: false })
    expect(bcrypt.compare).toHaveBeenCalledWith('invalidPassword', 'hashedPassword')
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid password' })
  })
})

describe('logout', () => {
  test('should clear refresh token, clear jwt cookie, and return status 200 when user is found', async () => {
    const req = {
      decoded: {
        username: 'testuser'
      }
    }
    const res = {
      clearCookie: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    const user = {
      save: jest.fn(),
      refreshToken: 'testtoken'
    }
    User.findOne = jest.fn().mockResolvedValue(user)

    await logout(req, res)

    expect(User.findOne).toHaveBeenCalledWith({ username: 'testuser' })
    expect(user.refreshToken).toBe('')
    expect(user.save).toHaveBeenCalled()
    expect(res.clearCookie).toHaveBeenCalledWith('accessToken')
    expect(res.clearCookie).toHaveBeenCalledWith('refreshToken')
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: 'User logged out successfully' })
  })

  test('should return error message with status 400 when user is not found', async () => {
    const req = {
      decoded: {
        username: 'testuser'
      }
    }
    const res = {
      clearCookie: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    User.findOne = jest.fn().mockResolvedValue(null)

    await logout(req, res)

    expect(User.findOne).toHaveBeenCalledWith({ username: 'testuser' })
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' })
  })
})

describe('verify', () => {
  test('should verify user successfully and return a refresh token', async () => {
    const req = {
      params: {
        token: 'testtoken'
      },
      decoded: {
        username: 'testuser'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn()
    }
    const user = {
      username: 'testuser',
      isDeleted: false,
      isVerified: false,
      save: jest.fn()
    }
    User.findOne = jest.fn().mockResolvedValue(user)
    jwt.sign = jest.fn().mockReturnValue('refreshToken')
    jwt.verify = jest.fn().mockReturnValue({ email: 'testemail', username: 'testuser' })

    await verifyUser(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: 'User verified successfully' })
    expect(User.findOne).toHaveBeenCalledWith({ email: 'testemail', username: 'testuser', isDeleted: false })
    expect(user.isVerified).toBe(true)
    expect(user.save).toHaveBeenCalled()
    expect(jwt.sign).toHaveBeenCalledWith(
      { username: 'testuser' },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '1d' }
    )
  })

  test('should throw an error if user is not found', async () => {
    const req = {
      params: {
        token: 'testtoken'
      },
      decoded: {
        username: 'testuser'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    User.findOne = jest.fn().mockResolvedValue(null)

    await verifyUser(req, res)

    expect(User.findOne).toHaveBeenCalledWith({ email: 'testemail', username: 'testuser', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' })
  })
})

describe('refreshToken', () => {
  test('should throw an error for a non-existing user', async () => {
    const req = {
      cookies: {
        refreshToken: 'refreshToken'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn()
    }
    jwt.verify = jest.fn().mockReturnValue({ username: 'testuser' })
    jwt.sign = jest.fn().mockReturnValue('newAccessToken')

    await refreshToken(req, res)

    expect(jwt.verify).toHaveBeenCalledWith('refreshToken', process.env.REFRESH_TOKEN_SECRET, expect.any(Function))
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' })
  })

  test('should return access token to user if refresh token is valid', async () => {
    const req = {
      cookies: {
        refreshToken: 'refreshToken'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn()
    }
    jwt.verify = jest.fn().mockReturnValue({ username: 'testuser' })
    jwt.sign = jest.fn().mockReturnValue('newAccessToken')
    const user = {
      username: 'testuser'
    }
    User.findOne = jest.fn().mockResolvedValue(user)

    await refreshToken(req, res)

    expect(jwt.verify).toHaveBeenCalledWith('refreshToken', process.env.REFRESH_TOKEN_SECRET, expect.any(Function))
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: 'Token refreshed successfully' })
  })
})
