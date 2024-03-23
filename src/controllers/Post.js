const Post = require('../models/Post')
const mongoose = require('mongoose')
const cloudinary = require('../utils/Cloudinary')
const PostUtils = require('../utils/Post')

const createPost = async (req, res) => {
  const post = req.body
  post.files = req.files
  post.username = req.decoded.username

  try {
    PostUtils.validatePost(post)

    if (post.type === 'Images & Video') {
      const urls = []

      for (const file of req.files) {
        const b64 = Buffer.from(file.buffer).toString('base64')
        const dataURI = 'data:' + file.mimetype + ';base64,' + b64
        const { secure_url } = await cloudinary.uploader.upload(dataURI, {
          resource_type: 'auto',
          folder: 'cReddit',
          allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'svg']
        })
        urls.push(secure_url)
      }
      post.content = urls.join(' ')
    }

    const createdPost = new Post({
      type: post.type,
      username: req.decoded.username,
      communityName: post.communityName,
      title: post.title,
      content: post.content || '',
      pollOptions: post.pollOptions?.map(option => ({ text: option, votes: 0 })) || [],
      expirationDate: post.expirationDate || null,
      isSpoiler: post.isSpoiler || false,
      isNSFW: post.isNSFW || false
    })

    await createdPost.save()
    res.status(201).json({ message: 'Post created successfully' + (post.unusedData ? ' while ignoring additional fields' : '') })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

const deletePost = async (req, res) => {
  const postId = req.params.postId

  try {
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: 'Invalid post id' })
    }
    const post = await Post.findOne({ _id: postId })
    if (!post) {
      return res.status(400).json({ message: 'Post is not found' })
    }
    if (post.username !== req.decoded.username) {
      return res.status(403).json({ message: 'You are not authorized to delete this post' })
    }
    if (post.type === 'Images & Video') {
      const publicIDs = post.content.split(' ').map(url => {
        const matches = url.match(/(cReddit\/.+)\.(.+)/)
        if (!matches) {
          return null
        } else {
          return matches
        }
      })
      if (publicIDs.includes(null)) {
        throw new Error('Invalid image or video URLs found in post')
      }
      for (const publicID of publicIDs) {
        if (publicID[2] === 'mp4') {
          await cloudinary.uploader.destroy(publicID[1], { resource_type: 'video' })
        } else {
          await cloudinary.uploader.destroy(publicID[1])
        }
      }
    }
    await post.deleteOne()
    res.status(200).json({ message: 'Post deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error deleting post' })
  }
}

const editPost = async (req, res) => {
  const postId = req.params.postId
  const { newContent } = req.body
  const username = req.decoded.username
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return res.status(400).json({ message: 'Invalid post id' })
  }
  if (!newContent) {
    return res.status(400).json({ message: 'No content to update' })
  }
  try {
    const post = await Post.findOne({ _id: postId })
    if (!post) {
      return res.status(400).json({ message: 'Post is not found' })
    }
    if (post.username !== username) {
      return res.status(403).json({ message: 'You are not authorized to edit this post' })
    }
    if (post.type !== 'Post' && post.type !== 'Poll') {
      return res.status(400).json({ message: 'You cannot edit this post type' })
    }
    post.content = newContent
    post.isEdited = true
    await post.save()
    res.status(200).json({ message: 'Post edited successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error editing post' })
  }
}

module.exports = {
  createPost,
  deletePost,
  editPost
}
