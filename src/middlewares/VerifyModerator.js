const CommunityModel = require('../models/Community')

const isModerator = async (req, res, next) => {
  const { communityName } = req.params
  const username = req.decoded.username
  try {
    const community = await CommunityModel.findOne({ name: communityName, isDeleted: false })
    if (!community) {
      return res.status(404).json({ message: 'Community not found' })
    }

    if (!community.moderators.includes(username)) {
      return res.status(403).json({ message: 'Unauthorized' })
    }

    next()
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error verifying moderator' })
  }
}

module.exports = {
  isModerator
}
