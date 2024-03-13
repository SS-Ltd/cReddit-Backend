const mongoose = require('mongoose')
const { createUser } = require('../controllers/Auth')
const User = require('../models/User')

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
        password: 'testpassword',
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

    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith({
      message: 'User created successfully',
      refreshToken: expect.any(String)
    })
  })

  test('should throw an error when trying to create a user with existing username', async () => {
    const req = {
      body: {
        username: 'testuser',
        password: 'testpassword',
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
        password: 'testpassword',
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
        password: 'testpassword',
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
        password: 'testpassword',
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
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid Gender' })
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
    expect(res.json).toHaveBeenCalledWith({ message: 'Password must be at least 8 characters long' })
  })
})
