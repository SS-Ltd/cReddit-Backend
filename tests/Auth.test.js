const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { createUser, deleteUser, login, logout, verifyUser, validatePassword, loginGoogle } = require('../src/controllers/Auth')
const { refreshToken } = require('../src/controllers/JWT')
const User = require('../src/models/User')

jest.mock('../src/models/User', () => {
  return jest.fn().mockImplementation(() => {
    return {
      save: jest.fn()
    }
  })
})

describe('validatePassword', () => {
  test('should return true when password meets the requirements', () => {
    const password = 'Abcdefg1'
    const result = validatePassword(password)
    expect(result).toBe(true)
  })

  test('should return false when password does not meet the requirements', () => {
    const password = 'abcdefgh'
    const result = validatePassword(password)
    expect(result).toBe(false)
  })
})

describe('createUser', () => {
  test('should create a new user when all fields are provided', async () => {
    const req = {
      body: {
        username: 'testuser',
        password: 'TestPassword123',
        email: 'nejocov739@fryshare.com',
        gender: 'None'
      },
      get: jest.fn().mockReturnValue('localhost:3000')
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn()
    }

    User.findOne = jest.fn().mockResolvedValueOnce(null)
    User.save = jest.fn()

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

    const user = {
      username: 'testuser',
      email: 'test1@example.com'
    }

    User.findOne = jest.fn().mockResolvedValueOnce(user)

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

    const user = {
      username: 'testuser',
      email: 'test1@example.com',
      isDeleted: false
    }

    User.findOne = jest.fn().mockResolvedValueOnce(user)

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

    User.findOne = jest.fn().mockResolvedValueOnce(null)

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

    User.findOne = jest.fn().mockResolvedValueOnce(null)

    await createUser(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Password must contain at least one lower and upper case letters and at least one digit and must be at least 8 characters' })
  })

  test('should restore a deleted user and add new fcmToken', async () => {
    const req = {
      body: {
        username: 'testuser',
        password: 'TestPassword123',
        email: 'test1@example.com',
        gender: 'None',
        fcmToken: 'newFCMToken'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const existingUser = {
      username: 'testuser',
      email: 'test1@example.com',
      isDeleted: true,
      fcmToken: ['oldFCMToken']
    }

    User.findOne = jest.fn().mockResolvedValueOnce(existingUser)
    User.updateOne = jest.fn()

    await createUser(req, res)

    expect(User.updateOne).toHaveBeenCalled()
  })

  test('should add fcmToken to existing user when restored', async () => {
    const req = {
      body: {
        username: 'testuser',
        password: 'TestPassword123',
        email: 'test1@example.com',
        gender: 'None',
        fcmToken: 'newFCMToken'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const existingUser = {
      username: 'testuser',
      email: 'test1@example.com',
      isDeleted: true,
      fcmToken: ['oldFCMToken']
    }

    User.findOne = jest.fn().mockResolvedValueOnce(existingUser)
    User.updateOne = jest.fn()

    await createUser(req, res)

    expect(User.updateOne).toHaveBeenCalled()
  })

  test('should throw an error when an invalid email is used', async () => {
    const req = {
      body: {
        username: 'testuser',
        password: 'TestPassword123',
        email: 'test1example.com',
        gender: 'None',
        fcmToken: 'newFCMToken'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    User.findOne = jest.fn().mockResolvedValueOnce(null)

    await createUser(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
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
    User.findOne = jest.fn().mockResolvedValueOnce({ username: 'testUser' })
    User.updateOne = jest.fn().mockResolvedValueOnce()

    await deleteUser(req, res)

    expect(User.findOne).toHaveBeenCalledWith({ username: 'testUser', isDeleted: false })
    expect(User.updateOne).toHaveBeenCalledWith({ username: 'testUser' }, { $set: { isDeleted: true, fcmToken: [] } })
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
      path: process.env.REFRESH_TOKEN_PATH
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

  test('should add fcmToken to user document if provided during login', async () => {
    const req = {
      body: {
        username: 'validUsername',
        password: 'validPassword',
        fcmToken: 'testFCMToken'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn()
    }
    const user = {
      username: 'validUsername',
      password: 'hashedPassword',
      fcmToken: ['existingFCMToken']
    }
    User.findOne = jest.fn().mockResolvedValue(user)
    bcrypt.compare = jest.fn().mockResolvedValue(true)
    jwt.sign = jest.fn().mockReturnValueOnce('accessToken').mockReturnValueOnce('refreshToken')
    User.updateOne = jest.fn()

    await login(req, res)

    expect(User.updateOne).toHaveBeenCalled()
  })

  test('should not add fcmToken to user document if not provided during login', async () => {
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
      password: 'hashedPassword',
      fcmToken: ['existingFCMToken']
    }
    User.findOne = jest.fn().mockResolvedValue(user)
    bcrypt.compare = jest.fn().mockResolvedValue(true)
    jwt.sign = jest.fn().mockReturnValueOnce('accessToken').mockReturnValueOnce('refreshToken')
    User.updateOne = jest.fn()

    await login(req, res)

    expect(User.updateOne).toHaveBeenCalled()
  })

  test('should update fcmToken if user already has fcmTokens', async () => {
    const req = {
      body: {
        username: 'validUsername',
        password: 'validPassword',
        fcmToken: 'testFCMToken'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn()
    }
    const user = {
      username: 'validUsername',
      password: 'hashedPassword',
      fcmToken: ['existingFCMToken']
    }
    User.findOne = jest.fn().mockResolvedValue(user)
    bcrypt.compare = jest.fn().mockResolvedValue(true)
    jwt.sign = jest.fn().mockReturnValueOnce('accessToken').mockReturnValueOnce('refreshToken')
    User.updateOne = jest.fn()

    await login(req, res)

    expect(User.updateOne).toHaveBeenCalled()
  })

  test('should work correctly when user does not have fcmTokens', async () => {
    const req = {
      body: {
        username: 'validUsername',
        password: 'validPassword',
        fcmToken: 'testFCMToken'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn()
    }
    const user = {
      username: 'validUsername',
      password: 'hashedPassword',
      fcmToken: {
        includes: jest.fn().mockReturnValue(false),
        push: jest.fn()
      }
    }

    User.findOne = jest.fn().mockResolvedValue(user)
    bcrypt.compare = jest.fn().mockResolvedValue(true)
    jwt.sign = jest.fn().mockReturnValueOnce('accessToken').mockReturnValueOnce('refreshToken')
    User.updateOne = jest.fn()

    await login(req, res)

    expect(User.updateOne).toHaveBeenCalled()
  })

  test('should throw an error when invalid username is provided', async () => {
    const req = {
      body: {
        username: 'invalidUsername',
        password: 'validPassword'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    User.findOne = jest.fn().mockResolvedValue(null)

    await login(req, res)

    expect(User.findOne).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
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
      cookie: jest.fn(),
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
    expect(res.cookie).toHaveBeenCalledWith('accessToken', '', {
      httpOnly: true,
      sameSite: 'None',
      secure: true,
      maxAge: 0
    })
    expect(res.cookie).toHaveBeenCalledWith('refreshToken', '', {
      httpOnly: true,
      sameSite: 'None',
      secure: true,
      maxAge: 0,
      path: process.env.REFRESH_TOKEN_PATH
    })
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

  test('should throw an error if token is not provided', async () => {
    const req = {
      cookies: {
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

    expect(jwt.verify).not.toHaveBeenCalledWith('refreshToken', process.env.REFRESH_TOKEN_SECRET, expect.any(Function))
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' })
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

describe('loginGoogle', () => {
  test('should create a new user with a nonexisting Google ID', async () => {
    const req = {
      body: {
        fcmToken: 'testFCMToken'
      },
      decoded: {
        email: 'testemail@mail.com',
        id: 'testid'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn()
    }

    const faker = {
      internet: {
        userName: jest.fn().mockReturnValue('testuser')
      }
    }

    const existingUser = null
    bcrypt.compare = jest.fn().mockResolvedValue(true)
    jwt.sign = jest.fn().mockReturnValueOnce('accessToken').mockReturnValueOnce('refreshToken')

    User.findOne = jest.fn().mockResolvedValueOnce(existingUser)
    User.save = jest.fn()

    await loginGoogle(req, res)

    expect(User.findOne).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(201)
  })

  test('should log the user in if Google ID exists', async () => {
    const req = {
      body: {
        fcmToken: 'testFCMToken'
      },
      decoded: {
        email: 'testemail@mail.com',
        id: 'testid'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn()
    }

    const faker = {
      internet: {
        userName: jest.fn().mockReturnValue('testuser')
      }
    }

    const existingUser = {
      username: 'testuser',
      isDeleted: false,
      fcmToken: ['existingFCMToken'],
      displayName: 'testuser',
      about: 'testuser',
      email: 'testemail@mail.com',
      profilePicture: 'testuser',
      banner: 'testuser',
      followers: ['testuser'],
      createdAt: new Date()
    }

    bcrypt.compare = jest.fn().mockResolvedValue(true)
    jwt.sign = jest.fn().mockReturnValueOnce('accessToken').mockReturnValueOnce('refreshToken')

    User.findOne = jest.fn().mockResolvedValueOnce(existingUser)
    User.updateOne = jest.fn()

    await loginGoogle(req, res)

    expect(User.findOne).toHaveBeenCalled()
    expect(User.updateOne).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })

  test('should restore a deleted user and log them in when Google ID exists', async () => {
    const req = {
      body: {
        fcmToken: 'testFCMToken'
      },
      decoded: {
        email: 'testemail@mail.com',
        id: 'testid'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn()
    }

    const faker = {
      internet: {
        userName: jest.fn().mockReturnValue('testuser')
      }
    }

    const existingUser = {
      username: 'testuser',
      isDeleted: true,
      fcmToken: ['existingFCMToken'],
      displayName: 'testuser',
      about: 'testuser',
      email: 'testemail@mail.com',
      profilePicture: 'testuser',
      banner: 'testuser',
      followers: ['testuser'],
      createdAt: new Date()
    }

    bcrypt.compare = jest.fn().mockResolvedValue(true)
    jwt.sign = jest.fn().mockReturnValueOnce('accessToken').mockReturnValueOnce('refreshToken')

    User.findOne = jest.fn().mockResolvedValueOnce(existingUser)
    User.updateOne = jest.fn()

    await loginGoogle(req, res)

    expect(User.findOne).toHaveBeenCalled()
    expect(User.updateOne).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(201)
  })

  test('should throw an error when email is missing', async () => {
    const req = {
      body: {
        fcmToken: 'testFCMToken'
      },
      decoded: {
        id: 'testid'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn()
    }

    const faker = {
      internet: {
        userName: jest.fn().mockReturnValue('testuser')
      }
    }

    await loginGoogle(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
  })
})
