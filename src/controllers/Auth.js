const User = require('../models/User')
const bcrypt = require('bcrypt')
const emailValidator = require('deep-email-validator')
const SendVerificationEmail = require('../Utils/Email')
const generateTokens = require('./JWT')

const createUser = async (req, res) => {
  const { username, password, email, gender } = req.body
  try {
    if (!username || !password || !email || !gender) {
      throw new Error('Username, password, email and gender are required')
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] })
    if (existingUser && !existingUser.isDeleted) {
      throw new Error('Username or email already exist')
    }

    if (existingUser && existingUser.isDeleted) {
      await User.updateOne({ $or: [{ username }, { email }] }, {
        $set: {
          isDeleted: false
        }
      })
      return res.status(201).json({ message: 'User created successfully' })
    }

    const validEmail = emailValidator.validate(email)
    if (!validEmail) {
      throw new Error('Invalid email')
    }

    if (!['Man', 'Woman', 'I Prefer Not To Say', 'None'].includes(gender)) {
      throw new Error('Invalid Gender')
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long')
    }

    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)

    const { refreshToken } = generateTokens({ username }, res)

    const newUser = new User({
      username,
      displayName: username,
      email,
      password: hash,
      gender,
      refreshToken
    })

    await newUser.save()
    await SendVerificationEmail(email, username)
    res.status(201).json({ message: 'User created successfully' })
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error creating user' })
  }
}

const deleteUser = async (req, res) => {
  const { username } = req.decoded
  try {
    const deletedUser = await User.findOne({ username, isDeleted: false })
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' })
    }

    await User.updateOne({ username }, {
      $set: {
        isDeleted: true
      }
    })

    res.status(200).json({ message: 'User deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error deleting user' })
  }
}

const login = async (req, res) => {
  const { username, password } = req.body
  try {
    if (!username || !password) {
      throw new Error('Username and password are required')
    }

    const user = await User.findOne({ username, isDeleted: false })

    if (!user) {
      throw new Error('Invalid username')
    }

    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      throw new Error('Invalid password')
    }

    const { refreshToken } = generateTokens({ username }, res)

    await User.updateOne({ username }, {
      $set: {
        refreshToken
      }
    })
    res.status(200).json({ message: 'User logged in successfully' })
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error logging in' })
  }
}

const logout = async (req, res) => {
  const { username } = req.decoded
  try {
    const user = await User.findOne({ username })

    if (!user) {
      throw new Error('User not found')
    }
    user.refreshToken = ''
    await user.save()

    res.clearCookie('accessToken')
    res.clearCookie('refreshToken')
    res.status(200).json({ message: 'User logged out successfully' })
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error logging out' })
  }
}

module.exports = {
  createUser,
  deleteUser,
  login,
  logout
}
