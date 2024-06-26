const mongoose = require('mongoose')
const PostModel = require('../models/Post')
const UserModel = require('../models/User')
const MessageModel = require('../models/Message')
const CommunityModel = require('../models/Community')
const MediaUtils = require('../utils/Media')
const PostUtils = require('../utils/Post')
const { sendNotification } = require('../utils/Notification')
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

    if (post.isLocked) {
      throw new Error('Cannot comment on a locked post')
    }

    if (post.communityName) {
      const community = await CommunityModel.findOne({ name: post.communityName, isDeleted: false })
      if (!community) {
        throw new Error('Community does not exist')
      }

      if (community.bannedUsers.find(bannedUser => bannedUser.name === comment.username)) {
        throw new Error('You are banned from this community')
      }

      if (community.type === 'private' && !(community.moderators.includes(comment.username) || community.approvedUsers.includes(comment.username))) {
        throw new Error('Only moderators and approved users can comment in this community')
      }

      if (!community.settings.allowImageComments && comment.files.length) {
        throw new Error('Community only allows text comments')
      }
    }

    const postOwner = await UserModel.findOne({ username: post.username, isDeleted: false })
    const user = await UserModel.findOne({ username: comment.username, isDeleted: false })

    if (postOwner && user && ((postOwner.blockedUsers.includes(comment.username) || user.blockedUsers.includes(postOwner)) && !user.moderatorInCommunities.includes(post.communityName))) {
      throw new Error('User is blocked from commenting on this post')
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

    PostUtils.upvotePost(newComment, user)

    await newComment.save()
    await user.save()

    if (postOwner) {
      if (postOwner.preferences.commentsNotifs && postOwner.username !== comment.username) {
        sendNotification(post.username, 'comment', newComment, req.decoded.username)
      }
    }

    post.followers.forEach(async follower => {
      const followerUser = await UserModel.findOne({ username: follower, isDeleted: false })
      if (followerUser && followerUser.preferences.postNotifs && followerUser.username !== comment.username) {
        sendNotification(follower, 'followedPost', newComment, req.decoded.username)
      }
    })

    const message = new MessageModel({
      from: comment.username,
      to: post.username,
      subject: 'post reply: ' + post.title,
      text: comment.isImage ? 'Image' : comment.content
    })

    if (!newComment.isImage) {
      const mentionRegex = /u\/(\w+)/
      const regex = new RegExp(mentionRegex, 'gi')
      const matches = newComment.content.match(regex)
      if (matches) {
        const mentionedUsers = new Set(matches.map(match => match.slice(2)))
        const validUsers = await UserModel.find({ username: { $in: Array.from(mentionedUsers) } })
        const messages = validUsers.map(user => ({
          from: newComment.username,
          to: user.username,
          subject: 'Mentioned in a comment',
          text: newComment.content.length > 100 ? newComment.content.slice(0, 100) + '...' : newComment.content
        }))
        validUsers.forEach(user => {
          if (user.username !== postOwner.username && user.preferences.mentionsNotifs) {
            sendNotification(user.username, 'mention', newComment, req.decoded.username, post.title)
          }
        })
        await MessageModel.create(messages)
      }
    }

    await message.save()
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
        newComment.content = urls[0]
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

    const options = {}
    options.username = user ? user.username : null
    options.blockedUsers = (!user || user.blockedUsers.length === 0) ? [] : user.blockedUsers
    options.isModerator = (!user || user.moderatorInCommunities.length === 0) ? null : true

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

    if (user && (post.communityName && !user.moderatorInCommunities.includes(post.communityName)) && (post.creatorBlockedUsers.includes(user.username) || user.blockedUsers.includes(post.username))) {
      return res.status(404).json({
        message: 'Post does not exist'
      })
    }

    if (user && post.username !== user.username && (comment.communityName && !user.moderatorInCommunities.includes(comment.communityName)) && (comment.creatorBlockedUsers.includes(user.username) || user.blockedUsers.includes(comment.username))) {
      return res.status(404).json({
        message: 'Comment does not exist'
      })
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
    comment.isBlocked = user ? user.blockedUsers.includes(comment.username) : false

    delete comment.blockedUsers

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
