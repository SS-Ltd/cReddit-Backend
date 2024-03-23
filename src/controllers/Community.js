const CommunityModel = require('../models/Community')

const getTopCommunities = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit
    const topCommunities = await CommunityModel.find()
      .sort({ members: -1 })
      .skip(skip)
      .limit(limit)

    res.status(200).json({ topCommunities })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error getting top communities' })
  }
}

module.exports = {
  getTopCommunities
}
