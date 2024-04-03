const PostModel = require('../models/Post')
const UserModel = require('../models/User')
const ObjectId = require('mongoose').Types.ObjectId

const getComment = async (req, res) => {
  try {
    const commentId = req.params.commentId

    if (!commentId) {
      return res.status(400).json({
        message: 'Comment ID is required'
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

    if (decoded) {
      const user = await UserModel.findOne({ username: decoded.username, isDeleted: false })

      if (!user) {
        return res.status(404).json({
          message: 'User does not exist'
        })
      }

      comment.isUpvoted = user.upvotedComments.includes(commentId)
      comment.isDownvoted = user.downvotedComments.includes(commentId)
      comment.isSaved = user.savedComments.includes(commentId)
    }

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
