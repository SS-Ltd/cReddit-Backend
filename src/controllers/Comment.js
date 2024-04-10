const mongoose = require('mongoose')
const PostModel = require('../models/Post')
const UserModel = require('../models/User')
const MediaUtils = require('../utils/Media')
const PostUtils = require('../utils/Post')
const HistoryModel = require('../models/History')
const ObjectId = require('mongoose').Types.ObjectId

const createComment = async (req, res) => {
  const comment = req.body
  comment.files = req.files
  comment.username = req.decoded.username

  try {
    if (!comment.postId || !mongoose.Types.ObjectId.isValid(comment.postId)) {
      throw new Error('Post ID is required')
    }

    if (!comment.content && !comment.files.length) {
      throw new Error('Comment must have content or image')
    }

    if (comment.content && comment.files.length) {
      throw new Error('Comment cannot have content & image at the same time')
    }

    if (comment.files.length > 1) {
      throw new Error('Comment can only have one image')
    }

    const post = await PostModel.findOne({ _id: comment.postId })
    if (!post || post.type === 'Comment') {
      throw new Error('Cannot comment on a non-existing post')
    }

    if (comment.files.length) {
      const urls = await MediaUtils.uploadImages(comment.files)
      comment.content = urls[0]
      comment.isImage = true
    }

    const newComment = new PostModel({
      type: 'Comment',
      communityName: post.communityName,
      username: comment.username,
      content: comment.content,
      postID: comment.postId,
      isImage: comment.isImage || false,
      upvotedPosts: [],
      downvotedPosts: []
    })

    const user = await UserModel.findOne({ username: comment.username, isDeleted: false })
    PostUtils.upvotePost(newComment, user)

    await newComment.save()
    await user.save()
    res.status(201).json({
      message: 'Comment created successfully',
      commentId: newComment._id
    })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

const editComment = async (req, res) => {
  const commentId = req.params.commentId
  const comment = req.body
  comment.files = req.files

  try {
    if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
      throw new Error('Comment ID is invalid')
    }

    const newComment = await PostModel.findOne({ _id: commentId })
    if (!newComment || newComment.type !== 'Comment') {
      throw new Error('Cannot edit a non-existing comment')
    }

    if (newComment.username !== req.decoded.username) {
      throw new Error('You are not authorized to edit this comment')
    }

    if (newComment.isImage) {
      if (!comment.files?.length) {
        throw new Error('No image provided')
      }
      if (comment.files?.length > 1) {
        throw new Error('Comment can only have one image')
      }
      if (comment.files?.length) {
        await MediaUtils.deleteImages([newComment.content])
        const urls = await MediaUtils.uploadImages(comment.files)
        comment.content = urls[0]
        comment.isImage = true
      }
    }

    if (!newComment.isImage) {
      if (!comment.content) {
        throw new Error('No text provided')
      }
      newComment.content = comment.content
    }

    await newComment.save()
    res.status(201).json({
      message: 'Comment edited successfully',
      commentId: newComment._id
    })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

const deleteComment = async (req, res) => {
  const commentId = req.params.commentId

  try {
    if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
      throw new Error('Comment ID is invalid')
    }

    const comment = await PostModel.findOne({ _id: commentId, isDeleted: false })
    if (!comment || comment.type !== 'Comment') {
      throw new Error('Cannot delete a non-existing comment')
    }

    if (comment.username !== req.decoded.username) {
      throw new Error('You are not authorized to delete this comment')
    }

    comment.isDeleted = true
    await comment.save()
    res.status(200).json({ message: 'Comment deleted successfully' })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

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
    comment.isModerator = user ? user.moderatorInCommunities.includes(post.community) : false

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
  createComment,
  editComment,
  deleteComment,
  getComment
}
