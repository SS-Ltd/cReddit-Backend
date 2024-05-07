const CommunityModel = require('../models/Community')
const PostModel = require('../models/Post')
const UserModel = require('../models/User')

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

      if (req.decoded) {
        const username = req.decoded.username
        if (community.type === 'private' && !(community.moderators.includes(username) || community.approvedUsers.includes(username))) {
          return res.status(401).json({ message: 'Unauthorized' })
        }
      }

      if (community.type === 'private') {
        return res.status(401).json({ message: 'Unauthorized' })
      }
    }

    next()
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error verifying moderator' })
  }
}

const isBlocked = async (req, res, next) => {
  const { postId } = req.params

  try {
    const post = await PostModel.findById(postId)
    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

    if (req.decoded) {
      const username = req.decoded.username
      const user = await UserModel.findOne({ username, isDeleted: false })
      if (!user) {
        return res.status(404).json({ message: 'User not found' })
      }

      const postUsername = post.username
      const postUser = await UserModel.findOne({ username: postUsername, isDeleted: false })
      if (!postUser) {
        return res.status(404).json({ message: 'Post/Comment user not found' })
      }

      if (!post.communityName) {
        if (postUser.blockedUsers.includes(username) || user.blockedUsers.includes(postUsername)) {
          return res.status(401).json({ message: 'User is blocked' })
        }
      } else {
        if (((postUser.blockedUsers.includes(username) || user.blockedUsers.includes(postUser)) && !user.moderatorInCommunities.includes(post.communityName))) {
          return res.status(401).json({ message: 'User is blocked' })
        }
      }
    }

    next()
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error verifying moderator' })
  }
}

module.exports = {
  isModerator,
  isPrivate,
  isBlocked
}
