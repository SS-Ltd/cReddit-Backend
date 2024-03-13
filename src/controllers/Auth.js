const User = require('../models/User')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const emailValidator = require('deep-email-validator')
const SendVerificationEmail = require('../Utils/Email')

async function createUser (req, res) {
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

    const accessToken = jwt.sign(
      {
        username
      },
      'dcfb3c278e0b4a50ba065ca60fada97efa4f20a97e6c2ed712b42b325a5139dd',
      { expiresIn: '10m' }
    )

    const refreshToken = jwt.sign(
      {
        username
      },
      '55a4a69aa127621f12185faa93c9b6bf7d9ddddafd0448e217bec17516858425',
      { expiresIn: '1d' }
    )

    const newUser = new User({
      username,
      displayName: username,
      email,
      password: hash,
      salt,
      gender,
      refreshToken
    })

    await newUser.save()

    res.cookie('jwt', accessToken, {
      httpOnly: true,
      sameSite: 'None',
      secure: true,
      maxAge: 24 * 60 * 60 * 1000
    })

    await SendVerificationEmail(email, username, accessToken)
    res.status(201).json({ message: 'User created successfully', refreshToken })
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error creating user' })
  }
}

async function deleteUser (req, res) {
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

module.exports = {
  createUser,
  deleteUser
}
