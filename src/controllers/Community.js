const CommunityModel = require('../models/Community')

const getTopCommunities = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit
    const topCommunities = await CommunityModel.find({ isDeleted: false })
      .sort({ members: -1 })
      .skip(skip)
      .limit(limit)

    res.status(200).json(topCommunities)
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error getting top communities' })
  }
}

const getEditedPosts = async (req, res) => {
  try {
    const { communityName } = req.params
    const community = await CommunityModel.findOne({ name: communityName, isDeleted: false })
    if (!community) {
      res.status(404).json({ message: 'Community not found' })
    }

    const editedPosts = await community.getEditedPosts()
    res.status(200).json(editedPosts)
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error getting edited posts' })
  }
}

module.exports = {
  getTopCommunities,
  getEditedPosts
}
