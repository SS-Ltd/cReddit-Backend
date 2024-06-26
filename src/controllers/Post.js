const Post = require('../models/Post')
const User = require('../models/User')
const MessageModel = require('../models/Message')
const Community = require('../models/Community')
const Report = require('../models/Report')
const mongoose = require('mongoose')
const MediaUtils = require('../utils/Media')
const PostUtils = require('../utils/Post')
const HistoryModel = require('../models/History')
const { sendNotification } = require('../utils/Notification')
const ObjectId = require('mongoose').Types.ObjectId
const schedule = require('node-schedule')

const sendNotificationUtil = async (post, user) => {
  const mentionRegex = /u\/(\w+)/g
  let match
  while ((match = mentionRegex.exec(post.content)) !== null) {
    const mentionedUsername = match[1]
    const mentionedUser = await User.findOne({ username: mentionedUsername })
    if (mentionedUser && mentionedUser.preferences.mentionsNotifs) {
      sendNotification(mentionedUsername, 'mention', post, user.username)
    }
  }
}

const createPost = async (req, res) => {
  const post = req.body
  post.files = req.files
  post.username = req.decoded.username

  try {
    PostUtils.validatePost(post)

    let childPost = null
    if (post.type === 'Cross Post') {
      childPost = await Post.findOne({ _id: post.postId, isDeleted: false })
      if (!childPost) {
        throw new Error('Child post does not exist')
      }
    }

    if (post.communityName) {
      const community = await Community.findOne({ name: post.communityName, isDeleted: false })
      if (!community) {
        throw new Error('Community does not exist')
      }

      if (community.bannedUsers.find(bannedUser => bannedUser.name === post.username)) {
        throw new Error('You are banned from this community')
      }

      if (community.type !== 'public' && !(community.moderators.includes(post.username) || community.approvedUsers.includes(post.username))) {
        throw new Error('Only moderators and approved users can post in this community')
      }

      if (post.date) {
        if (!community.moderators.includes(post.username)) {
          throw new Error('Only moderators can schedule posts')
        }
      }

      PostUtils.validatePostAccordingToCommunitySettings(post, community, childPost)

      if (community.isNSFW) {
        post.isNsfw = true
      }
    }

    if (post.type === 'Images & Video') {
      const urls = await MediaUtils.uploadImages(req.files)
      post.content = urls.join(' ')
    }

    const user = await User.findOne({ username: post.username, isDeleted: false })

    if (!user) {
      throw new Error('User does not exist')
    }

    if (!post.communityName) {
      post.isNsfw = user.preferences.isNSFW
    }

    const createdPost = new Post({
      type: post.type,
      username: req.decoded.username,
      communityName: post.communityName || null,
      title: post.title,
      content: post.content || '',
      child: childPost ? childPost._id : null,
      pollOptions: post.pollOptions?.map(option => ({ text: option, votes: 0 })) || [],
      expirationDate: post.expirationDate || null,
      isSpoiler: post.isSpoiler || false,
      isNsfw: post.isNSFW || false,
      upvotedPosts: [],
      downvotedPosts: [],
      createdAt: post.date || new Date()
    })

    PostUtils.upvotePost(createdPost, user)

    if (post.type !== 'Images & Video' && post.content) {
      const mentionRegex = /u\/(\w+)/
      const regex = new RegExp(mentionRegex, 'gi')
      const matches = post.content.match(regex)
      if (matches) {
        const mentionedUsers = new Set(matches.map(match => match.slice(2)))
        const validUsers = await User.find({ username: { $in: Array.from(mentionedUsers) } })
        const messages = validUsers.map(user => ({
          from: post.username,
          to: user.username,
          subject: 'Mentioned in a post: ' + post.title,
          text: post.content.length > 100 ? post.content.slice(0, 100) + '...' : post.content
        }))
        validUsers.forEach(validUser => {
          if (validUser.preferences.mentionsNotifs) {
            sendNotification(validUser.username, 'mention', createdPost, user.username)
          }
        })
        await MessageModel.create(messages)
      }
    }

    if (!post.date) {
      sendNotificationUtil(createdPost, user)
    } else {
      const date = new Date(post.date)

      const job = schedule.scheduleJob(date, async () => {
        sendNotificationUtil(createdPost, user)
      })

      createdPost.job = job.name
    }

    await user.save()
    await createdPost.save()

    res.status(201).json({
      message: 'Post created successfully' + (post.unusedData ? ' while ignoring additional fields' : ''),
      postId: createdPost._id
    })
  } catch (error) {
    console.log(error)
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
    if (post.job) {
      const oldJob = schedule.scheduledJobs[post.job]
      if (oldJob) {
        oldJob.cancel()
      }
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
  const { newContent, date } = req.body
  const username = req.decoded.username
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return res.status(400).json({ message: 'Invalid post id' })
  }
  if (!newContent) {
    return res.status(400).json({ message: 'No content to update' })
  }
  try {
    const post = await Post.findOne({ _id: postId, isDeleted: false, isRemoved: false })
    if (!post) {
      return res.status(400).json({ message: 'Post is not found' })
    }
    if (post.username !== username) {
      return res.status(403).json({ message: 'You are not authorized to edit this post' })
    }
    if (post.type !== 'Post' && post.type !== 'Poll') {
      return res.status(400).json({ message: 'You cannot edit this post type' })
    }
    if (date) {
      console.log(new Date(date), new Date())

      const user = await User.findOne({ username: post.username })

      const newPost = new Post({
        type: post.type,
        username: post.username,
        communityName: post.communityName,
        title: post.title,
        content: newContent,
        pollOptions: post.pollOptions,
        expirationDate: post.expirationDate,
        isSpoiler: post.isSpoiler,
        isNsfw: post.isNsfw,
        upvote: 0,
        downvote: 0,
        netVote: 0,
        views: 0,
        isImage: post.isImage,
        isLocked: post.isLocked,
        isDeleted: false,
        isEdited: true,
        isRemoved: false,
        followers: post.followers,
        actions: post.actions,
        mostRecentUpvote: post.mostRecentUpvote,
        createdAt: new Date(date)
      })

      const oldJob = schedule.scheduledJobs[post.job]
      if (oldJob) {
        oldJob.cancel()
      }

      if (new Date(date) > new Date()) {
        const job = schedule.scheduleJob(new Date(date), async () => {
          sendNotificationUtil(newPost, user)
        })
        newPost.job = job.name
      } else {
        sendNotificationUtil(newPost, user)
      }

      PostUtils.upvotePost(newPost, user)

      await newPost.save()
      await user.save()

      await Post.findOneAndUpdate({ _id: postId }, { $set: { isDeleted: true } })
    } else {
      post.content = newContent
      post.isEdited = true
    }
    await post.save()
    res.status(200).json({ message: 'Post edited successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error editing post' })
  }
}

const markSpoiler = async (req, res) => {
  try {
    const username = req.decoded.username
    const user = await User.findOne({ username, isDeleted: false })

    const post = await Post.findOne({ _id: req.params.postId, isDeleted: false })

    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

    if (!user.moderatorInCommunities.includes(post.communityName) && post.username !== username) {
      return res.status(401).json({ message: 'You are not authorized to mark this post as spoiler' })
    }

    const community = await Community.findOne({ name: post.communityName })
    if (community && !community.settings.allowSpoilers && req.body.isSpoiler) {
      return res.status(400).json({ message: 'Community does not allow spoilers' })
    }

    post.isSpoiler = req.body.isSpoiler
    await post.save()

    res.status(200).json({ message: 'Post marked as spoiler successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error marking post as spoiler' })
  }
}

const markNSFW = async (req, res) => {
  try {
    const username = req.decoded.username
    const user = await User.findOne({ username, isDeleted: false })

    const post = await Post.findOne({ _id: req.params.postId, isDeleted: false })

    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

    if (!user.moderatorInCommunities.includes(post.communityName) && post.username !== username) {
      return res.status(401).json({ message: 'You are not authorized to mark this post as NSFW' })
    }

    post.isNsfw = req.body.isNSFW
    await post.save()

    res.status(200).json({ message: 'Post marked as nsfw successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error marking post as spoiler' })
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
    if (isSaved && user.savedPosts.some(item => item.postId.toString() === post._id.toString())) {
      return res.status(400).json({ message: 'Post/comment is already saved' })
    }
    if (!isSaved && !user.savedPosts.some(item => item.postId.toString() === post._id.toString())) {
      return res.status(400).json({ message: 'Post/comment is not saved' })
    }

    const savePost = {
      postId: post._id,
      savedAt: new Date()
    }
    if (isSaved) {
      user.savedPosts.push(savePost)
    } else {
      user.savedPosts = user.savedPosts.filter(item => item.postId.toString() !== postId.toString())
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
    const post = await Post.findOne({ _id: postId, isDeleted: false, isRemoved: false })
    if (!post) {
      return res.status(400).json({ message: 'Post is not found' })
    }
    const user = await User.findOne({ username })
    if (!user) {
      return res.status(400).json({ message: 'User is not found' })
    }

    const alreadyHidden = user.hiddenPosts.some(item => item.postId.toString() === postId.toString())
    if (isHidden && alreadyHidden) {
      return res.status(400).json({ message: 'Post is already hidden' })
    }
    if (!isHidden && !alreadyHidden) {
      return res.status(400).json({ message: 'Post is not hidden' })
    }
    const hidePost = {
      postId: post._id,
      savedAt: new Date()
    }
    if (isHidden) {
      user.hiddenPosts.push(hidePost)
    } else {
      user.hiddenPosts = user.hiddenPosts.filter(item => item.postId.toString() !== postId.toString())
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
    const post = await Post.findOne({ _id: postId, isDeleted: false, isRemoved: false })
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
      return { $lte: new Date(Date.now()), $gte: new Date(Date.now() - 60 * 60 * 1000) }
    case 'today':
      return { $lte: new Date(Date.now()), $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    case 'week':
      return { $lte: new Date(Date.now()), $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    case 'month':
      return { $lte: new Date(Date.now()), $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    case 'year':
      return { $lte: new Date(Date.now()), $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
    case 'all':
      return { $lte: new Date(Date.now()) }
    default:
      return { $lte: new Date(Date.now()) }
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
    }

    let post = await Post.getPost(new ObjectId(postId))
    post = post[0]

    if (!post) {
      return res.status(404).json({
        message: 'Post does not exist'
      })
    }

    if (user && (post.communityName && !user.moderatorInCommunities.includes(post.communityName)) && (post.creatorBlockedUsers.includes(user.username) || user.blockedUsers.includes(post.username))) {
      return res.status(404).json({
        message: 'Post does not exist'
      })
    }

    await Post.findOneAndUpdate(
      { _id: postId, isDeleted: false, isRemoved: false },
      { $inc: { views: 1 } }
    )

    if (user && !post.isNsfw) {
      const history = await HistoryModel.findOne({ owner: user.username, post: postId })

      if (!history) {
        await HistoryModel.create({
          owner: user.username,
          post: postId
        })
      } else {
        history.updatedAt = new Date()
        await history.save()
      }
    }

    post.isUpvoted = user ? user.upvotedPosts.some(item => item.postId.toString() === post._id.toString()) : false
    post.isDownvoted = user ? user.downvotedPosts.some(item => item.postId.toString() === post._id.toString()) : false
    post.isSaved = user ? user.savedPosts.some(item => item.postId.toString() === post._id.toString()) : false
    post.isHidden = user ? user.hiddenPosts.some(item => item.postId.toString() === post._id.toString()) : false
    post.isJoined = user ? user.communities.includes(post.communityName) : false
    post.isModerator = user ? user.moderatorInCommunities.includes(post.communityName) : false
    post.isBlocked = user ? user.blockedUsers.includes(post.username) : false

    post.isNSFW = post.isNsfw
    delete post.isNsfw
    delete post.creatorBlockedUsers

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

    let post = await Post.getPost(new ObjectId(postId))
    post = post[0]

    if (!post) {
      return res.status(404).json({
        message: 'Post does not exist'
      })
    }

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

    const communityName = post.communityName
    let community = null
    if (communityName) {
      community = await Community.findOne({ name: communityName, isDeleted: false })
    }

    if (!community && communityName) {
      return res.status(404).json({
        message: 'Community does not exist'
      })
    }

    let sortChoice = community ? community.settings.suggestedSort : 'best'
    sortChoice = req.query.sort ? req.query.sort : sortChoice
    const sort = getSortingMethod(sortChoice)

    const options = { sort }
    options.random = false
    options.page = page
    options.limit = limit
    options.username = user ? user.username : null
    options.blockedUsers = (!user || user.blockedUsers.length === 0) ? [] : user.blockedUsers
    options.isModerator = (!user || user.moderatorInCommunities.length === 0 || !user.moderatorInCommunities.includes(communityName)) ? null : true
    if (sortChoice === 'best') {
      options.random = true
    }

    const comments = await Post.getComments(new ObjectId(postId), options)

    comments.forEach((comment) => {
      comment.isUpvoted = user ? user.upvotedPosts.some(item => item.postId.toString() === comment._id.toString()) : false
      comment.isDownvoted = user ? user.downvotedPosts.some(item => item.postId.toString() === comment._id.toString()) : false
      comment.isSaved = user ? user.savedPosts.some(item => item.postId.toString() === comment._id.toString()) : false
      comment.isBlocked = user ? user.blockedUsers.includes(comment.username) : false
    })

    if (user && !post.isNsfw) {
      const history = await HistoryModel.findOne({ owner: user.username, post: postId })

      if (!history) {
        await HistoryModel.create({
          owner: user.username,
          post: postId
        })
      } else {
        history.updatedAt = new Date()
        await history.save()
      }
    }

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
    options.username = user ? user.username : null
    options.blockedUsers = (!user || user.blockedUsers.length === 0) ? [] : user.blockedUsers
    options.moderatedCommunities = (!user || user.moderatorInCommunities.length === 0) ? [] : user.moderatorInCommunities

    const communities = (!user || user.communities.length === 0) ? [] : user.communities
    const mutedCommunities = (!user || user.mutedCommunities.length === 0) ? null : user.mutedCommunities
    const follows = (!user || user.follows.length === 0) ? null : user.follows
    const showAdultContent = user ? user.preferences.showAdultContent : false

    if (sort === 'best' || !user) {
      posts = await Post.getRandomHomeFeed(options, communities, mutedCommunities, showAdultContent)
    } else {
      posts = await Post.getSortedHomeFeed(options, communities, mutedCommunities, follows, showAdultContent)
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

      post.isNSFW = post.isNsfw
      delete post.isNsfw

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

const getPopular = async (req, res) => {
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

    let posts = []

    const options = {}
    options.random = false
    options.page = page
    options.limit = limit
    options.username = user ? user.username : null
    options.blockedUsers = (!user || user.blockedUsers.length === 0) ? [] : user.blockedUsers
    options.moderatedCommunities = (!user || user.moderatorInCommunities.length === 0) ? [] : user.moderatorInCommunities

    const mutedCommunities = (!user || user.mutedCommunities.length === 0) ? null : user.mutedCommunities
    const showAdultContent = user ? user.preferences.showAdultContent : false

    posts = await Post.getPopular(options, mutedCommunities, showAdultContent)

    posts.forEach(post => {
      delete post.pollOptions
      delete post.expirationDate

      post.isNSFW = post.isNsfw
      delete post.isNsfw

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

const votePost = async (req, res) => {
  const postId = req.params.postId
  const username = req.decoded.username
  const pollOption = req.body?.pollOption

  try {
    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
      throw new Error('Invalid post id')
    }

    const postToVote = await Post.findOne({ _id: postId, isDeleted: false, isRemoved: false })
    if (!postToVote) {
      throw new Error('Post does not exist')
    }

    const user = await User.findOne({ username, isDeleted: false })

    if (req.type === 'upvote') {
      PostUtils.upvotePost(postToVote, user)
      const postOwner = await User.findOne({ username: postToVote.username })
      if (postOwner && postOwner.preferences.postsUpvotesNotifs && postToVote.username !== user.username) {
        if (postToVote.type !== 'Comment') {
          sendNotification(postToVote.username, 'upvotedPost', postToVote, user.username)
        } else {
          console.log('upvoting comment')
          sendNotification(postToVote.username, 'upvotedComment', postToVote, user.username)
        }
      }
    } else if (req.type === 'downvote') {
      PostUtils.downvotePost(postToVote, user)
    } else if (req.type === 'votePoll') {
      PostUtils.votePoll(postToVote, user, pollOption)
    }

    await postToVote.save()
    await user.save()

    if (user && !postToVote.isNsfw && postToVote.type !== 'Comment') {
      const history = await HistoryModel.findOne({ owner: user.username, post: postId })
      if (history) {
        history.updatedAt = new Date()
        await history.save()
      } else {
        await HistoryModel.create({
          owner: user.username,
          post: postId
        })
      }
    }

    res.status(200).json({ message: 'Post voted successfully', postVotes: postToVote.netVote })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

const reportPost = async (req, res) => {
  try {
    const postId = req.params.postId
    const communityRule = req.body.communityRule
    const username = req.decoded.username

    const post = await Post.findOne({ _id: postId, isDeleted: false, isRemoved: false })
    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

    if (!post.communityName) {
      return res.status(400).json({ message: 'Post does not belong to a community' })
    }

    const community = await Community.findOne({ name: post.communityName, isDeleted: false })
    if (!community) {
      return res.status(404).json({ message: 'Community not found' })
    }

    const isComment = post.type === 'Comment'

    const ruleExits = community.rules.some(rule => (rule.text === communityRule && !isComment && rule.appliesTo !== 'Comments only') || (rule.text === communityRule && isComment && rule.appliesTo !== 'Posts only'))
    if (!ruleExits) {
      return res.status(400).json({ message: 'Community rule does not apply' })
    }

    if (post.username === username) {
      return res.status(400).json({ message: 'You cannot report your own post' })
    }

    const existingReport = await Report.findOne({ user: username, post: postId, reason: communityRule, isDeleted: false })
    if (!existingReport) {
      const report = new Report({
        user: username,
        post: postId,
        type: post.type,
        reason: communityRule,
        isDeleted: false
      })
      await report.save()
    }

    const message = 'Report Submitted\nThanks for your report and for looking out for yourself and your fellow redditors. Your reporting helps make Reddit a better, safer, and more welcoming place for everyone; and it means a lot to us. '
    return res.status(200).json({ message })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error reporting post' })
  }
}

const acceptPost = async (req, res) => {
  try {
    const username = req.decoded.username

    const user = await User.findOne({ username: username, isDeleted: false })
    const post = await Post.findOne({ _id: req.params.postId, isDeleted: false })

    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (!user.moderatorInCommunities.includes(post.communityName)) {
      return res.status(401).json({ message: 'You are not authorized to approve this post' })
    }

    post.isApproved = req.body.isApproved
    await post.save()
    res.status(200).json({ message: 'Post approved successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Error approving post: ' + error.message })
  }
}

const removePost = async (req, res) => {
  try {
    const username = req.decoded.username

    const user = await User.findOne({ username: username, isDeleted: false })
    const post = await Post.findOne({ _id: req.params.postId, isDeleted: false })

    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (!user.moderatorInCommunities.includes(post.communityName)) {
      return res.status(401).json({ message: 'You are not authorized to remove this post' })
    }

    post.isRemoved = req.body.isRemoved
    await post.save()
    res.status(200).json({ message: 'Post removed successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Error removing post: ' + error.message })
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
  getHomeFeed,
  reportPost,
  votePost,
  getSortingMethod,
  filterWithTime,
  acceptPost,
  removePost,
  getPopular,
  markSpoiler,
  markNSFW
}
