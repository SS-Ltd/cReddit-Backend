const PostModel = require('../models/Post')
const UserModel = require('../models/User')
const ObjectId = require('mongoose').Types.ObjectId
const mongoose = require('mongoose')

const getComment = async (req, res) => {
  try {
    const commentId = req.params.commentId

    if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({
        message: 'Comment ID is wrong'
      })
    }

    let comment = await PostModel.findOne({ _id: new ObjectId(commentId), isDeleted: false, type: 'Comment', isRemoved: false }).select('-isDeleted -updatedAt -createdAt -__v -upvote -downvote -views -isEdited -isRemoved -followers -mostRecentUpvote -pollOptions -actions -isNsfw')

    if (!comment) {
      return res.status(404).json({
        message: 'Comment does not exist'
      })
    }

    const userProfilePicture = await comment.getUserProfilePicture()
    comment = comment.toObject()

    const decoded = req.decoded
    let user = null

    if (decoded) {
      user = await UserModel.findOne({ username: decoded.username, isDeleted: false })

      if (!user) {
        return res.status(404).json({
          message: 'User does not exist'
        })
      }
    }

    comment.isUpvoted = user ? user.upvotedPosts.some(item => item.postId.toString() === comment._id.toString()) : false
    comment.isDownvoted = user ? user.downvotedPosts.some(item => item.postId.toString() === comment._id.toString()) : false
    comment.isSaved = user ? user.savedPosts.some(item => item.postId.toString() === comment._id.toString()) : false

    comment.profilePicture = userProfilePicture[0].profilePicture[0]

    return res.status(200).json(comment)
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      message: 'An error occurred while getting comment'
    })
  }
}

module.exports = {
  getComment
}
