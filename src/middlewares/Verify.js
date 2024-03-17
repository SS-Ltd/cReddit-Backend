const jwt = require('jsonwebtoken')
const axios = require('axios')

const verifyToken = (req, res, next) => {
  const token = req.cookies.accessToken
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    req.decoded = decoded
    next()
  } catch (error) {
    console.error('Error verifying token: ', error)
    return res.status(403).json({ message: 'Invalid token' })
  }
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
  verifyToken,
  verifyGoogleToken
}
