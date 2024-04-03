const Post = require('../models/Post')
const User = require('../models/User')
const Community = require('../models/Community')
const mongoose = require('mongoose')
const cloudinary = require('../utils/Cloudinary')
const PostUtils = require('../utils/Post')
const HistoryModel = require('../models/History')
const ObjectId = require('mongoose').Types.ObjectId

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

    if (post.communityName) {
      const community = await Community.findOne({ name: post.communityName })
      if (!community) {
        throw new Error('Community does not exist')
      }
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
    res.status(201).json({
      message: 'Post created successfully' + (post.unusedData ? ' while ignoring additional fields' : ''),
      postId: createdPost._id
    })
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

const savePost = async (req, res) => {
  const postId = req.params.postId
  const username = req.decoded.username
  const isSaved = req.body?.isSaved
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return res.status(400).json({ message: 'Invalid post id' })
  }
  if (isSaved === undefined) {
    return res.status(400).json({ message: 'isSaved field is required' })
  }
  try {
    const post = await Post.findOne({ _id: postId })
    if (!post) {
      return res.status(400).json({ message: 'Post is not found' })
    }
    const user = await User.findOne({ username })
    if (!user) {
      return res.status(400).json({ message: 'User is not found' })
    }
    if (isSaved && user.savedPosts.includes(postId)) {
      return res.status(400).json({ message: 'Post is already saved' })
    }
    if (!isSaved && !user.savedPosts.includes(postId)) {
      return res.status(400).json({ message: 'Post is not saved' })
    }
    if (isSaved) {
      user.savedPosts.push(postId)
    } else {
      user.savedPosts = user.savedPosts.filter(id => id.toString() !== postId)
    }
    await user.save()
    res.status(200).json({ message: ('Post ' + (isSaved ? 'saved' : 'unsaved') + ' successfully') })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error saving post' })
  }
}

const hidePost = async (req, res) => {
  const postId = req.params.postId
  const username = req.decoded.username
  const isHidden = req.body?.isHidden
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return res.status(400).json({ message: 'Invalid post id' })
  }
  if (isHidden === undefined) {
    return res.status(400).json({ message: 'isHidden field is required' })
  }
  try {
    const post = await Post.findOne({ _id: postId })
    if (!post) {
      return res.status(400).json({ message: 'Post is not found' })
    }
    const user = await User.findOne({ username })
    if (!user) {
      return res.status(400).json({ message: 'User is not found' })
    }
    if (isHidden && user.hiddenPosts.includes(postId)) {
      return res.status(400).json({ message: 'Post is already hidden' })
    }
    if (!isHidden && !user.hiddenPosts.includes(postId)) {
      return res.status(400).json({ message: 'Post is not hidden' })
    }
    if (isHidden) {
      user.hiddenPosts.push(postId)
    } else {
      user.hiddenPosts = user.hiddenPosts.filter(id => id.toString() !== postId)
    }
    await user.save()
    res.status(200).json({ message: ('Post visibility changed successfully') })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error saving post' })
  }
}

const lockPost = async (req, res) => {
  const postId = req.params.postId
  const username = req.decoded.username
  const isLocked = req.body?.isLocked
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return res.status(400).json({ message: 'Invalid post id' })
  }
  if (isLocked === undefined) {
    return res.status(400).json({ message: 'isLocked field is required' })
  }
  try {
    const post = await Post.findOne({ _id: postId })
    if (!post) {
      return res.status(400).json({ message: 'Post is not found' })
    }
    let community = null
    if (post.communityName) {
      community = await Community.findOne({ name: post.communityName })
    }
    if ((community === null && post.username !== username) || (community !== null && !community.moderators.includes(username))) {
      return res.status(403).json({ message: 'You are not authorized to lock this post' })
    }
    if (post.isLocked === isLocked) {
      return res.status(400).json({ message: 'Post is already ' + (isLocked ? 'locked' : 'unlocked') })
    }
    post.isLocked = isLocked
    await post.save()
    res.status(200).json({ message: ('Post ' + (isLocked ? 'locked' : 'unlocked') + ' successfully') })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error locking post' })
  }
}

const getSortingMethod = (sort) => {
  switch (sort) {
    case 'new':
      return { createdAt: -1, _id: -1 }
    case 'top':
      return { netVote: -1, createdAt: -1, _id: -1 }
    case 'hot':
      return { views: -1, createdAt: -1, _id: -1 }
    case 'rising':
      return { mostRecentUpvote: -1, _id: -1 }
    case 'old':
      return { createdAt: 1, _id: 1 }
    default:
      return { createdAt: -1, _id: -1 }
  }
}

const filterWithTime = (time) => {
  switch (time) {
    case 'now':
      return { $gte: new Date(Date.now() - 60 * 60 * 1000) }
    case 'today':
      return { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    case 'week':
      return { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    case 'month':
      return { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    case 'year':
      return { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
    case 'all':
      return { $gte: new Date(0) }
    default:
      return { $gte: new Date(0) }
  }
}

const getPost = async (req, res) => {
  try {
    const postId = req.params.postId

    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({
        message: 'Post ID is wrong'
      })
    }

    let post = await Post.getPost(new ObjectId(postId))
    post = post[0]

    if (!post) {
      return res.status(404).json({
        message: 'Post does not exist'
      })
    }

    await Post.findOneAndUpdate(
      { _id: postId, isDeleted: false, isRemoved: false },
      { $inc: { views: 1 } }
    )

    const decoded = req.decoded
    let user = null

    // User may be a guest
    if (decoded) {
      user = await User.findOne({ username: decoded.username, isDeleted: false })

      if (!user) {
        return res.status(404).json({
          message: 'User does not exist'
        })
      }

      post.isUpvoted = user.upvotedPosts.includes(postId)
      post.isDownvoted = user.downvotedPosts.includes(postId)
      post.isSaved = user.savedPosts.includes(postId)
      post.isHidden = user.hiddenPosts.includes(postId)

      const history = await HistoryModel.findOne({ owner: user.username, post: postId })

      if (!history) {
        await HistoryModel.create({
          owner: user.username,
          post: postId
        })
      } else {
        history.createdAt = new Date()
        await history.save()
      }
    }

    if (post.type !== 'Poll') {
      delete post.pollOptions
      delete post.expirationDate
    } else {
      post.pollOptions.forEach(option => {
        option.votes = option.voters.length
        option.isVoted = user ? option.voters.includes(user.username) : false
        delete option.voters
        delete option._id
      })
    }

    return res.status(200).json(post)
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      message: 'An error occurred while getting post'
    })
  }
}

const getComments = async (req, res) => {
  try {
    const postId = req.params.postId
    const limit = req.query.limit ? parseInt(req.query.limit) : 10
    const page = req.query.page ? parseInt(req.query.page) - 1 : 0

    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({
        message: 'Post ID is wrong'
      })
    }

    const post = await Post.findOne({ _id: new ObjectId(postId), isDeleted: false })

    if (!post) {
      return res.status(404).json({
        message: 'Post does not exist'
      })
    }

    const community = await Community.findOne({ name: post.communityName, isDeleted: false })

    if (!community) {
      return res.status(404).json({
        message: 'Community does not exist'
      })
    }

    const communitySuggestedSort = community.suggestedSort
    const sort = getSortingMethod(communitySuggestedSort)

    const options = { sort }
    options.random = false
    options.page = page
    options.limit = limit
    if (communitySuggestedSort === 'best') {
      options.random = true
    }

    const comments = await Post.getComments(new ObjectId(postId), options)

    const decoded = req.decoded
    let user = null

    if (decoded) {
      user = await User.findOne({ username: decoded.username, isDeleted: false })

      if (!user) {
        return res.status(404).json({
          message: 'User does not exist'
        })
      }
    }

    comments.forEach((comment) => {
      if (user) {
        comment.isUpvoted = user.upvotedComments.includes(comment._id)
        comment.isDownvoted = user.downvotedComments.includes(comment._id)
        comment.isSaved = user.savedComments.includes(comment._id)
      }
    })

    return res.status(200).json(comments)
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      message: 'An error occurred while getting comments of post'
    })
  }
}

const getHomeFeed = async (req, res) => {
  try {
    const decoded = req.decoded
    let user = null

    if (decoded) {
      user = await User.findOne({ username: decoded.username, isDeleted: false })

      if (!user) {
        return res.status(404).json({
          message: 'User does not exist'
        })
      }
    }

    const page = req.query.page ? parseInt(req.query.page) - 1 : 0
    const limit = req.query.limit ? parseInt(req.query.limit) : 10
    let sort = req.query.sort ? req.query.sort : 'best'
    let time = req.query.time ? req.query.time : 'all'

    if (sort !== 'top') {
      time = 'all'
    }

    if (!user) {
      sort = 'best'
    }

    const sortMethod = getSortingMethod(sort)

    time = filterWithTime(time)

    let posts = []

    const options = { sortMethod }
    options.random = false
    options.page = page
    options.limit = limit
    options.time = time

    const communities = (!user || user.communities.length === 0) ? null : user.communities
    const bannedInCommunities = (!user || user.bannedInCommunities.length === 0) ? null : user.bannedInCommunities
    const mutedCommunities = (!user || user.mutedCommunities.length === 0) ? null : user.mutedCommunities

    if (sort === 'best' || !user) {
      posts = await Post.getRandomHomeFeed(options, bannedInCommunities, mutedCommunities)
    } else {
      posts = await Post.getSortedHomeFeed(options, communities, bannedInCommunities, mutedCommunities)
    }

    if (posts.length === 0) {
      return res.status(404).json({
        message: 'No posts found for the home feed'
      })
    }

    posts.forEach(post => {
      if (post.type !== 'Poll') {
        delete post.pollOptions
        delete post.expirationDate
      } else {
        post.pollOptions.forEach(option => {
          option.votes = option.voters.length
          option.isVoted = user ? option.voters.includes(user.username) : false
          delete option.voters
          delete option._id
        })
      }

      post.isUpvoted = user ? user.upvotedPosts.some(item => item.postId.toString() === post._id.toString()) : false
      post.isDownvoted = user ? user.downvotedPosts.some(item => item.postId.toString() === post._id.toString()) : false
      post.isSaved = user ? user.savedPosts.some(item => item.postId.toString() === post._id.toString()) : false
      post.isHidden = user ? user.hiddenPosts.some(item => item.postId.toString() === post._id.toString()) : false
      post.isJoined = user ? user.communities.includes(post.communityName) : false
      post.isModerator = user ? user.moderatorInCommunities.includes(post.communityName) : false
    })

    return res.status(200).json(posts)
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      message: 'An error occurred while getting home feed'
    })
  }
}

module.exports = {
  getPost,
  createPost,
  deletePost,
  editPost,
  savePost,
  hidePost,
  lockPost,
  getComments,
  getHomeFeed
}
