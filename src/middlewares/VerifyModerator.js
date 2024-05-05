const CommunityModel = require('../models/Community')
const PostModel = require('../models/Post')

const isModerator = async (req, res, next) => {
  const { communityName } = req.params
  const username = req.decoded.username
  try {
    const community = await CommunityModel.findOne({ name: communityName, isDeleted: false })
    if (!community) {
      return res.status(404).json({ message: 'Community not found' })
    }

    if (!community.moderators.includes(username)) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    next()
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error verifying moderator' })
  }
}

const isPrivate = async (req, res, next) => {
  const { postId, commentId } = req.params
  const id = postId || commentId
  const username = req.decoded.username
  try {
    const post = await PostModel.findById(id)
    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

    if (post.communityName) {
      const community = await CommunityModel.findOne({ name: post.communityName, isDeleted: false })
      if (!community) {
        return res.status(404).json({ message: 'Community not found' })
      }

      if (community.type === 'private' && !(community.moderators.includes(username) || community.approvedUsers.includes(username))) {
        return res.status(401).json({ message: 'Unauthorized' })
      }
    }

    next()
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error verifying moderator' })
  }
}

module.exports = {
  isModerator,
  isPrivate
}
