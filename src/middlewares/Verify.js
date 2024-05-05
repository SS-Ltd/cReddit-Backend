const jwt = require('jsonwebtoken')
const axios = require('axios')
require('cookie-parser')

const isLoggedIn = (req, res, next) => {
  if (req.cookies.accessToken) {
    verifyToken(req, res, next)
  } else {
    next()
  }
}

const verifyToken = (req, res, next) => {
  const token = req.cookies.accessToken
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  try {
    req.decoded = authenticate(token)
    if (!req.decoded) {
      return res.status(403).json({ message: 'Invalid token' })
    }
    next()
  } catch (error) {
    console.error('Error verifying token: ', error)
    return res.status(403).json({ message: 'Invalid token' })
  }
}

const authenticate = (accessToken) => {
  console.log('accessToken: ', accessToken)
  return jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      console.log('Error verifying token: ', err)
      return null
    }
    return user
  })
}

const verifyGoogleToken = async (req, res, next) => {
  const token = req.body.googleToken
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  try {
    const response = await axios.get(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${token}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    })

    req.decoded = response.data
    next()
  } catch (error) {
    console.error('Error verifying Google token: ', error)
    return res.status(400).json({ message: 'Invalid token' })
  }
}

module.exports = {
  isLoggedIn,
  verifyToken,
  verifyGoogleToken,
  authenticate
}
