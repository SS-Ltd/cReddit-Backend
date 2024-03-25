const PostModel = require('../models/Post')
const UserModel = require('../models/User')
const CommunityModel = require('../models/Community')
const HistoryModel = require('../models/History')

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

    let post = await PostModel.findOne({ _id: postId, isDeleted: false })

    if (!post) {
      return res.status(404).json({
        message: 'Post does not exist'
      })
    }

    const community = await CommunityModel.findOne({ name: post.communityName, isDeleted: false })

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
    comments = comments[0].comments

    post = post.toObject()

    const decoded = req.decoded

    // User may be a guest
    if (decoded) {
      const user = await UserModel.findOne({ username: decoded.username, isDeleted: false })

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

    return res.status(200).json(post)
  } catch (error) {
    return res.status(500).json({
      message: error.message
    })
  }
}

module.exports = {
  getPost
}
