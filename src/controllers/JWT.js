const dotenv = require('dotenv').config()
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
    path: '/refreshToken'
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

module.exports = {
  generateTokens,
  decryptToken
}
