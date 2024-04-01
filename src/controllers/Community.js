const CommunityModel = require('../models/Community')
const PostModel = require('../models/Post')
const UserModel = require('../models/User')

const createCommunity = async (req, res) => {
  const owner = req.decoded.username
  const { name, isNSFW } = req.body

  try {
    if (!name || isNSFW == null) {
      return res.status(400).json({ message: 'Name and isNSFW are required' })
    }

    const repeated = await CommunityModel.findOne({ name })
    if (repeated) {
      return res.status(400).json({ message: 'Community already exists' })
    }

    const community = new CommunityModel({
      owner: owner,
      name: name,
      isNSFW: isNSFW
    })

    await community.save()

    res.status(201).json({
      message: 'Community created successfully',
      owner: community.owner,
      name: community.name,
      isNSFW: community.isNSFW
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error creating community' })
  }
}

const isNameAvailable = async (req, res) => {
  try {
    const { name } = req.params

    if (!name) {
      return res.status(400).json({
        message: 'Name is required'
      })
    }

    const user = await CommunityModel.findOne({ name })

    if (!user) {
      return res.status(200).json({
        message: 'Name is available',
        available: true
      })
    } else {
      return res.status(409).json({
        message: 'Name is not available',
        available: false
      })
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: 'An error occurred while checking if the name is available'
    })
  }
}

const getCommunityView = async (req, res) => {
  try {
    if (!req.params.subreddit) {
      throw new Error('Community name is required')
    }
    const community = await CommunityModel.findOne({ name: req.params.subreddit })
    if (!community || community.isDeleted) {
      return res.status(404).json({ message: 'Community not found' })
    }
    res.status(200).json({
      name: community.name,
      icon: community.icon,
      banner: community.banner,
      members: community.members,
      rules: community.rules,
      moderators: community.moderators
    })
  } catch (error) {
    res.status(400).json({ message: 'Error getting user view: ' + error.message })
  }
}

const getTopCommunities = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit
    const topCommunities = await CommunityModel.find({ isDeleted: false })
      .sort({ members: -1 })
      .skip(skip)
      .limit(limit)

    res.status(200).json(topCommunities)
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error getting top communities' })
  }
}

const getEditedPosts = async (req, res) => {
  try {
    const { communityName } = req.params
    const community = await CommunityModel.findOne({ name: communityName, isDeleted: false })
    if (!community) {
      res.status(404).json({ message: 'Community not found' })
    }

    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10

    const options = {
      page,
      limit
    }

    const editedPosts = await community.getEditedPosts(options)
    res.status(200).json(editedPosts)
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error getting edited posts' })
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
    default:
      return { createdAt: -1, _id: -1 }
  }
}

const getSortedCommunityPosts = async (req, res) => {
  try {
    const subreddit = req.params.subreddit

    if (!subreddit) {
      return res.status(400).json({
        message: 'Subreddit is required'
      })
    }

    const community = await CommunityModel.findOne({ name: subreddit, isDeleted: false })

    if (!community) {
      return res.status(404).json({
        message: 'Community does not exist'
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

    const page = req.query.page ? parseInt(req.query.page) - 1 : 0
    const limit = req.query.limit ? parseInt(req.query.limit) : 10
    const sort = req.query.sort ? req.query.sort : 'hot'
    let time = req.query.time ? req.query.time : 'all'

    if (sort !== 'top') {
      time = 'all'
    }

    const sortMethod = getSortingMethod(sort, time)

    let posts = await PostModel.find({
      communityName: subreddit,
      isDeleted: false,
      isRemoved: false,
      createdAt: filterWithTime(time)
    })
      .select('-__v -followers')
      .sort(sortMethod)
      .skip(page * limit)
      .limit(limit)

    if (posts.length === 0) {
      if (posts.length === 0) {
        return res.status(404).json({
          message: 'No posts found for the community'
        })
      }
    }

    const commentCounts = await Promise.all(posts.map(post => post.getCommentCount()))
    const userProfilePictures = await Promise.all(posts.map(post => post.getUserProfilePicture()))

    posts = posts.map(post => post.toObject())
    let count = 0
    posts.forEach(post => {
      if (user) {
        post.isUpvoted = user.upvotedPosts.includes(post._id)
        post.isDownvoted = user.downvotedPosts.includes(post._id)
        post.isSaved = user.savedPosts.includes(post._id)
        post.isHidden = user.hiddenPosts.includes(post._id)
      }
      post.commentCount = commentCounts[count][0].commentCount
      post.profilePicture = userProfilePictures[count][0].profilePicture[0]
      count++
    })

    return res.status(200).json(posts)
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      message: 'An error occurred while getting posts for the community'
    })
  }
}

module.exports = {
  createCommunity,
  getCommunityView,
  isNameAvailable,
  getTopCommunities,
  getEditedPosts,
  getSortedCommunityPosts
}
