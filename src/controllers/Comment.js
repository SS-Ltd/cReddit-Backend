const PostModel = require('../models/Post')
const UserModel = require('../models/User')
const HistoryModel = require('../models/History')
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

    let comment = await PostModel.getComment(new ObjectId(commentId))
    comment = comment[0]

    if (!comment) {
      return res.status(404).json({
        message: 'Comment does not exist'
      })
    }

    let post = await PostModel.getPost(new ObjectId(comment.postID))
    post = post[0]

    if (!post) {
      return res.status(404).json({
        message: 'Post does not exist'
      })
    }

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

    if (post.isNsfw && (!user || !user.preferences.showAdultContent)) {
      return res.status(401).json({
        message: 'Unable to view NSFW content'
      })
    }

    comment.isUpvoted = user ? user.upvotedPosts.some(item => item.postId.toString() === comment._id.toString()) : false
    comment.isDownvoted = user ? user.downvotedPosts.some(item => item.postId.toString() === comment._id.toString()) : false
    comment.isSaved = user ? user.savedPosts.some(item => item.postId.toString() === comment._id.toString()) : false

    if (user && !post.isNsfw) {
      const history = await HistoryModel.findOne({ owner: user.username, post: comment.postID })

      if (!history) {
        await HistoryModel.create({
          owner: user.username,
          post: comment.postID
        })
      } else {
        history.updatedAt = new Date()
        await history.save()
      }
    }

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
