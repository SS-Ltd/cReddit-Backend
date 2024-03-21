const CommunityModel = require('../models/Community')

const getTopCommunities = async (req, res) => {
  try {
    const topCommunities = await CommunityModel.find().sort({ members: -1 })
    res.status(200).json({ topCommunities })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error getting top communities' })
  }
}

module.exports = {
  getTopCommunities
}
