require('dotenv').config()
require('cookie-parser')
const User = require('../models/User')
const jwt = require('jsonwebtoken')

const generateTokens = (payload, res) => {
  const { username } = payload
  const accessToken = jwt.sign(
    {
      username
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '10m' }
  )

  const refreshToken = jwt.sign(
    {
      username
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '1d' }
  )
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    sameSite: 'None',
    secure: true,
    maxAge: 24 * 60 * 60 * 1000
  })
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    sameSite: 'None',
    secure: true,
    maxAge: 24 * 60 * 60 * 1000,
    path: '/user/refresh-token'
  })
  return { refreshToken }
}

const decryptToken = (token, secret) => {
  return jwt.verify(token, secret, (error, decoded) => {
    if (error) {
      throw new Error('Invalid or expired token')
    }
    return decoded
  })
}

const refreshToken = async (req, res) => {
  const { refreshToken } = req.cookies
  if (!refreshToken) {
    return res.status(401).json({ message: 'Unauthorized' })
  }
  try {
    const { username } = decryptToken(refreshToken, process.env.REFRESH_TOKEN_SECRET)
    const user = await User.findOne({ username, isDeleted: false })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    generateTokens({ username }, res)
    res.status(200).json({ message: 'Token refreshed successfully' })
  } catch (error) {
    res.status(401).json({ message: error.message || 'Unauthorized' })
  }
}

module.exports = {
  generateTokens,
  decryptToken,
  refreshToken
}
