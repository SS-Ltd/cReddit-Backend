const User = require('../models/User')
const bcrypt = require('bcrypt')
const emailValidator = require('email-validator')
const { faker } = require('@faker-js/faker')
const { sendVerificationEmail } = require('../utils/Email')
const { generateTokens, decryptToken } = require('./JWT')

const validatePassword = (password) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\w!@#$%^&*()\-_=+\\|[\]{};:'",.<>/?`~ ])[\w!@#$%^&*()\-_=+\\|[\]{};:'",.<>/?`~ ]{8,}$/
  return passwordRegex.test(password)
}

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
      return res.status(201).json({
        message: 'User created successfully',
        username: existingUser.username,
        displayName: existingUser.displayName,
        about: existingUser.about,
        email: existingUser.email,
        profilePicture: existingUser.profilePicture,
        banner: existingUser.banner,
        followers: existingUser.followers ? existingUser.followers.length : 0,
        cakeDay: existingUser.createdAt
      })
    }

    const validEmail = emailValidator.validate(email)
    if (!validEmail) {
      throw new Error('Invalid email')
    }

    if (!['Man', 'Woman', 'I Prefer Not To Say', 'None'].includes(gender)) {
      throw new Error('Invalid gender')
    }

    if (!validatePassword(password)) {
      throw new Error('Password must contain at least one lower and upper case letters and at least one digit and must be at least 8 characters')
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
    await sendVerificationEmail(email, username)
    res.status(201).json({
      message: 'User created successfully',
      username: newUser.username,
      displayName: newUser.displayName,
      about: newUser.about,
      email: newUser.email,
      profilePicture: newUser.profilePicture,
      banner: newUser.banner,
      followers: newUser.followers ? newUser.followers.length : 0,
      cakeDay: newUser.createdAt
    })
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
    res.status(200).json({
      message: 'User logged in successfully',
      username: user.username,
      displayName: user.displayName,
      about: user.about,
      email: user.email,
      profilePicture: user.profilePicture,
      banner: user.banner,
      followers: user.followers ? user.followers.length : 0,
      cakeDay: user.createdAt
    })
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

    res.cookie('accessToken', '', {
      httpOnly: true,
      sameSite: 'None',
      secure: true,
      maxAge: 0
    })
    res.cookie('refreshToken', '', {
      httpOnly: true,
      sameSite: 'None',
      secure: true,
      maxAge: 0,
      path: process.env.REFRESH_TOKEN_PATH
    })
    res.status(200).json({ message: 'User logged out successfully' })
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error logging out' })
  }
}

const verifyUser = async (req, res) => {
  const { token } = req.params
  try {
    const { email, username } = decryptToken(token, process.env.VERIFICATION_TOKEN_SECRET)
    const user = await User.findOne({ username, email, isDeleted: false })
    if (!user) {
      throw new Error('User not found')
    }

    const { refreshToken } = generateTokens({ username }, res)

    user.isVerified = true
    user.refreshToken = refreshToken
    await user.save()
    res.status(200).json({ message: 'User verified successfully' })
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error verifying user' })
  }
}

const loginGoogle = async (req, res) => {
  const username = faker.internet.userName()
  const email = req.decoded.email
  const gender = 'None'
  try {
    if (!username || !email || !gender) {
      throw new Error('Username, email and gender are required')
    }

    const existingUser = await User.findOne({ 'preferences.google': req.decoded.id })
    if (existingUser && !existingUser.isDeleted) {
      const { refreshToken } = generateTokens({ username: existingUser.username }, res)
      await User.updateOne({ username: existingUser.username }, {
        $set: {
          refreshToken
        }
      })
      return res.status(200).json({
        message: 'User logged in successfully',
        username: existingUser.username,
        displayName: existingUser.displayName,
        about: existingUser.about,
        email: existingUser.email,
        profilePicture: existingUser.profilePicture,
        banner: existingUser.banner,
        followers: existingUser.followers ? existingUser.followers.length : 0,
        cakeDay: existingUser.createdAt
      })
    }

    if (existingUser && existingUser.isDeleted) {
      await User.updateOne({ 'preferences.google': req.decoded.id }, {
        $set: {
          isDeleted: false
        }
      })
      return res.status(201).json({
        message: 'User created successfully',
        username: existingUser.username,
        displayName: existingUser.displayName,
        about: existingUser.about,
        email: existingUser.email,
        profilePicture: existingUser.profilePicture,
        banner: existingUser.banner,
        followers: existingUser.followers ? existingUser.followers.length : 0,
        cakeDay: existingUser.createdAt
      })
    }

    const { refreshToken } = generateTokens({ username }, res)

    const newUser = new User({
      username,
      displayName: username,
      email,
      password: '',
      gender,
      'preferences.google': req.decoded.id,
      refreshToken
    })

    await newUser.save()
    res.status(201).json({
      message: 'User created successfully',
      username: newUser.username,
      displayName: newUser.displayName,
      about: newUser.about,
      email: newUser.email,
      profilePicture: newUser.profilePicture,
      banner: newUser.banner,
      followers: newUser.followers ? newUser.followers.length : 0,
      cakeDay: newUser.createdAt
    })
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error creating user' })
  }
}

module.exports = {
  createUser,
  deleteUser,
  login,
  logout,
  verifyUser,
  loginGoogle
}
