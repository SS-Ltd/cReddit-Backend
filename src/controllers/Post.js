const Post = require('../models/Post')
const User = require('../models/User')
const Community = require('../models/Community')
const mongoose = require('mongoose')
const MediaUtils = require('../utils/Media')
const PostUtils = require('../utils/Post')
const HistoryModel = require('../models/History')

const createPost = async (req, res) => {
  const post = req.body
  post.files = req.files
  post.username = req.decoded.username

  try {
    PostUtils.validatePost(post)

    if (post.type === 'Images & Video') {
      const urls = await MediaUtils.uploadImages(req.files)
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
      isNsfw: post.isNSFW || false,
      upvotedPosts: [],
      downvotedPosts: []
    })

    const user = await User.findOne({ username: post.username })
    PostUtils.upvotePost(createdPost, user)

    await createdPost.save()
    await user.save()
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
    const post = await Post.findOne({ _id: postId, isDeleted: false })
    if (!post) {
      return res.status(400).json({ message: 'Post is not found' })
    }
    if (post.username !== req.decoded.username) {
      return res.status(403).json({ message: 'You are not authorized to delete this post' })
    }
    post.isDeleted = true
    await post.save()
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
    const post = await Post.findOne({ _id: postId, isDeleted: false, isRemoved: false})
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
    const post = await Post.findOne({ _id: postId, isDeleted: false, isRemoved: false })
    if (!post) {
      return res.status(400).json({ message: 'Post/comment is not found' })
    }
    const user = await User.findOne({ username })
    if (!user) {
      return res.status(400).json({ message: 'User is not found' })
    }
    if (isSaved && user.savedPosts.includes(postId)) {
      return res.status(400).json({ message: 'Post/comment is already saved' })
    }
    if (!isSaved && !user.savedPosts.includes(postId)) {
      return res.status(400).json({ message: 'Post/comment is not saved' })
    }
    if (isSaved) {
      user.savedPosts.push(postId)
    } else {
      user.savedPosts = user.savedPosts.filter(id => id.toString() !== postId)
    }
    await user.save()
    res.status(200).json({ message: ('Post/comment ' + (isSaved ? 'saved' : 'unsaved') + ' successfully') })
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
    const post = await Post.findOne({ _id: postId, isDeleted: false, isRemoved: false})
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
    const post = await Post.findOne({ _id: postId, isDeleted: false, isRemoved: false})
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
    case 'old':
      return { createdAt: 1, _id: 1 }
    default:
      return { createdAt: -1, _id: -1 }
  }
}

const getPost = async (req, res) => {
  try {
    const postId = req.params.postId
    const limit = req.query.limit ? parseInt(req.query.limit) : 10

    if (!postId) {
      return res.status(400).json({
        message: 'Post ID is required'
      })
    }

    let post = await Post.findOne({ _id: postId, isDeleted: false, isRemoved: false })

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

    post.views += 1
    await post.save()

    const communitySuggestedSort = community.suggestedSort
    const sort = getSortingMethod(communitySuggestedSort)

    const options = { sort }
    options.random = false
    options.limit = limit
    if (communitySuggestedSort === 'best') {
      options.random = true
    }

    let comments = await post.getComments(options)
    const commentCount = await post.getCommentCount()
    const userProfilePicture = await post.getUserProfilePicture()
    comments = comments[0].comments

    post = post.toObject()

    const decoded = req.decoded

    // User may be a guest
    if (decoded) {
      const user = await User.findOne({ username: decoded.username, isDeleted: false })

      if (!user) {
        return res.status(404).json({
          message: 'User does not exist'
        })
      }

      post.isUpvoted = user.upvotedPosts.includes(postId)
      post.isDownvoted = user.downvotedPosts.includes(postId)
      post.isSaved = user.savedPosts.includes(postId)
      post.isHidden = user.hiddenPosts.includes(postId)

      comments.forEach((comment) => {
        comment.isUpvoted = user.upvotedComments.includes(comment._id)
        comment.isDownvoted = user.downvotedComments.includes(comment._id)
        comment.isSaved = user.savedComments.includes(comment._id)
      })

      await HistoryModel.create({
        owner: user.username,
        post: post._id
      })
    }

    post.comments = comments
    post.commentCount = commentCount[0].commentCount
    post.profilePicture = userProfilePicture[0].profilePicture[0]

    return res.status(200).json(post)
  } catch (error) {
    return res.status(500).json({
      message: 'An error occurred while getting post'
    })
  }
}

const votePost = async (req, res) => {
  const postId = req.params.postId
  const username = req.decoded.username
  const pollOption = req.body?.pollOption

  try {
    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
      throw new Error('Invalid post id')
    }

    const postToVote = await Post.findOne({ _id: postId, isDeleted: false, isRemoved: false})
    if (!postToVote) {
      throw new Error('Post does not exist')
    }

    const user = await User.findOne({ username, isDeleted: false })

    if (req.type === 'upvote') {
      PostUtils.upvotePost(postToVote, user)
    } else if (req.type === 'downvote') {
      PostUtils.downvotePost(postToVote, user)
    } else if (req.type === 'votePoll') {
      PostUtils.votePoll(postToVote, user, pollOption)
    }

    await postToVote.save()
    await user.save()
    res.status(200).json({ message: 'Post voted successfully', postVotes: postToVote.netVote })
  } catch (error) {
    res.status(400).json({ message: error.message })
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
  votePost
}
