const User = require('../models/User')
const bcrypt = require('bcrypt')
const emailValidator = require('deep-email-validator')

async function createUser (req, res) {
  const { username, password, email, gender } = req.body
  try {
    if (!username || !password || !email || !gender) {
      throw new Error('Username, password, email and gender are required')
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] })
    if (existingUser) {
      throw new Error('Username or email already exist')
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

    const newUser = new User({
      username,
      displayName: username,
      email,
      password: hash,
      salt,
      gender
    })

    await newUser.save()
    res.status(201).json({ message: 'User created successfully' })
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error creating user' })
  }
}

module.exports = {
  createUser
}
