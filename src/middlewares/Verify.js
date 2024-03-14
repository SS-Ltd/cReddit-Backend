const jwt = require('jsonwebtoken')

function verifyToken (req, res, next) {
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

module.exports = verifyToken
