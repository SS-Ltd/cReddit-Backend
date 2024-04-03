const mongoose = require('mongoose')
const PostModel = require('../models/Post')
const MediaUtils = require('../utils/Media')

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

    const post = await PostModel.findOne(comment.postId)
    if (!post) {
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
      isImage: comment.isImage || false
    })

    await newComment.save()
    res.status(201).json({
      message: 'Comment created successfully',
      commentId: newComment._id
    })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

module.exports = {
  createComment
}
