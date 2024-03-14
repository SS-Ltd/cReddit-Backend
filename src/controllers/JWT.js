const dotenv = require('dotenv').config()
const jwt = require('jsonwebtoken')

function generateTokens (payload, res) {
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

module.exports = generateTokens
