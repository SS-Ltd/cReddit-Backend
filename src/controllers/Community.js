const CommunityModel = require('../models/Community')
const PostModel = require('../models/Post')
const UserModel = require('../models/User')
const MediaUtils = require('../utils/Media')

const createCommunity = async (req, res) => {
  const owner = req.decoded.username
  const { name, isNSFW, type } = req.body

  try {
    if (!name || isNSFW == null) {
      return res.status(400).json({ message: 'Name and isNSFW are required' })
    }

    const repeated = await CommunityModel.findOne({ name })
    if (repeated) {
      return res.status(400).json({ message: 'Community already exists' })
    }

    const user = await UserModel.findOne({ username: owner, isDeleted: false })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (!['public', 'private', 'restricted'].includes(type)) {
      return res.status(400).json({ message: 'Invalid community type' })
    }

    const community = new CommunityModel({
      owner: owner,
      name: name,
      isNSFW: isNSFW,
      type: type
    })

    user.moderatorInCommunities.push(name)
    user.communities.push(name)
    await user.save()

    community.moderators.push(owner)
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
      throw new Error('Subreddit name is required')
    }
    const community = await CommunityModel.findOne({ name: req.params.subreddit })
    if (!community || community.isDeleted) {
      return res.status(404).json({ message: 'Subreddit not found' })
    }

    const moderators = []

    for (let i = 0; i < community.moderators.length; i++) {
      const moderator = await UserModel.findOne({ username: community.moderators[i] })
      if (!moderator || moderator.isDeleted) continue
      moderators.push({
        username: moderator.username,
        profilePicture: moderator.profilePicture
      })
    }

    const communityData = {
      name: community.name,
      icon: community.icon,
      banner: community.banner,
      members: community.members,
      rules: community.rules,
      description: community.description,
      topic: community.topic,
      moderators: moderators,
      isNSFW: community.isNSFW,
      type: community.type
    }

    if (req.decoded) {
      const user = await UserModel.findOne({ username: req.decoded.username })

      if (user) {
        communityData.isModerator = user.moderatorInCommunities.includes(community.name)
        communityData.isMember = user.communities.includes(community.name)
        communityData.isMuted = user.mutedCommunities.includes(community.name)
      }
    }

    res.status(200).json(communityData)
  } catch (error) {
    res.status(400).json({ message: 'Error getting subreddit view: ' + error.message })
  }
}

const getTopCommunities = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const topCommunitiesQuery = { isDeleted: false }
    if (req.decoded) {
      const user = await UserModel.findOne({ username: req.decoded.username })
      if (user) {
        if (user.preferences.showAdultContent === false) {
          topCommunitiesQuery.isNSFW = false
        }
      }
    }

    let topCommunities = await CommunityModel.find(topCommunitiesQuery)
      .sort({ members: -1 })
      .skip(skip)
      .limit(limit)
      .select('owner name icon topic members description')

    topCommunities = topCommunities.map(community => { return community.toObject() })

    if (req.decoded) {
      const user = await UserModel.findOne({ username: req.decoded.username })
      if (user) {
        topCommunities.forEach(community => {
          community.isJoined = user.communities.includes(community.name)
        })
      }
    } else {
      topCommunities.forEach(community => {
        community.isJoined = false
      })
    }
    const count = await CommunityModel.countDocuments(topCommunitiesQuery)

    res.status(200).json({
      topCommunities: topCommunities,
      count
    })
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
    case 'reports':
      return { 'reports.length': -1 }
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
    const showAdultContent = user ? user.preferences.showAdultContent : false

    if (sort !== 'top') {
      time = 'all'
    }

    const sortMethod = getSortingMethod(sort)

    time = filterWithTime(time)

    const options = {
      page: page,
      limit,
      sortMethod,
      time
    }
    options.username = user ? user.username : null
    options.blockedUsers = (!user || user.blockedUsers.length === 0) ? [] : user.blockedUsers
    options.isModerator = (!user || user.moderatorInCommunities.length === 0 || !user.moderatorInCommunities.includes(community.name)) ? null : true

    const posts = await PostModel.byCommunity(subreddit, options, showAdultContent)

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
    })

    return res.status(200).json(posts)
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      message: 'An error occurred while getting posts for the community'
    })
  }
}

const joinCommunity = async (req, res) => {
  try {
    const subreddit = req.params.subreddit
    const username = req.decoded.username

    const community = await CommunityModel.findOne({ name: subreddit, isDeleted: false })
    if (!community) {
      return res.status(404).json({ message: 'Community not found' })
    }
    const user = await UserModel.findOne({ username: username, isDeleted: false })

    const isMember = user.communities.includes(subreddit)
    if (isMember) {
      return res.status(400).json({
        message: 'User is already a member of the community'
      })
    }

    if (community.blockedUsers && community.blockedUsers.includes(username)) {
      return res.status(400).json({ message: 'User is blocked from the community' })
    }

    if (community.type === 'private' && !community.approvedUsers.includes(username)) {
      return res.status(400).json({ message: 'User is not approved to join the community' })
    }

    user.communities.push(subreddit)
    community.members++

    await user.save()
    await community.save()

    res.status(200).json({
      message: 'User joined the community successfully'
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: 'Error joining community: ' + error
    })
  }
}

const leaveCommunity = async (req, res) => {
  try {
    const subreddit = req.params.subreddit
    const username = req.decoded.username

    const community = await CommunityModel.findOne({ name: subreddit, isDeleted: false })
    const user = await UserModel.findOne({ username: username, isDeleted: false })

    const isMember = user.communities.includes(subreddit)
    if (!isMember) {
      return res.status(400).json({
        message: 'User is not a member of the community'
      })
    }

    user.communities = user.communities.filter(item => item !== subreddit)
    community.members--

    if (community.type === 'private') {
      if (user.approvedInCommunities.includes(community.name)) {
        user.approvedInCommunities = user.approvedInCommunities.filter(item => item !== community.name)
        community.approvedUsers = community.approvedUsers.filter(item => item !== user.username)
      }
    }

    await user.save()
    await community.save()

    res.status(200).json({
      message: 'User left the community successfully'
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: 'Error leaving community: ' + error
    })
  }
}

const muteCommunity = async (req, res) => {
  try {
    const subreddit = req.params.subreddit
    const username = req.decoded.username

    const community = await CommunityModel.findOne({ name: subreddit, isDeleted: false })

    if (!community) {
      return res.status(404).json({
        message: 'Community not found'
      })
    }

    const user = await UserModel.findOne({ username: username, isDeleted: false })

    const isMuted = user.mutedCommunities.includes(subreddit)

    if (isMuted) {
      user.mutedCommunities = user.mutedCommunities.filter(item => item !== subreddit)

      await user.save()
      return res.status(200).json({
        message: 'Community unmuted successfully'
      })
    }

    user.mutedCommunities.push(subreddit)
    await user.save()

    res.status(200).json({
      message: 'Community muted successfully'
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error muting community: ' + error
    })
  }
}

const getReportedPosts = async (req, res) => {
  try {
    const subreddit = req.params.communityName

    if (!subreddit) {
      return res.status(400).json({
        message: 'Subreddit is required'
      })
    }

    const community = await CommunityModel.findOne({ name: subreddit, isDeleted: false })

    if (!community) {
      return res.status(404).json({
        message: 'Community not found'
      })
    }

    const user = await UserModel.findOne({ username: req.decoded.username, isDeleted: false })

    if (!user) {
      return res.status(404).json({
        message: 'User does not exist'
      })
    }

    const page = req.query.page ? parseInt(req.query.page) - 1 : 0
    const limit = req.query.limit ? parseInt(req.query.limit) : 10
    const sort = req.query.sort ? req.query.sort : 'new'
    const type = req.query.type ? req.query.type : 'all'

    const sortMethod = getSortingMethod(sort)

    const options = {
      page: page,
      limit,
      sortMethod,
      type
    }

    const posts = await PostModel.getReportedPosts(subreddit, options)

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
    })

    return res.status(200).json(posts)
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      message: 'An error occurred while getting reported posts for the community'
    })
  }
}

const getCommunityRules = async (req, res) => {
  try {
    const subreddit = req.params.communityName

    if (!subreddit) {
      return res.status(400).json({
        message: 'Subreddit is required'
      })
    }

    const community = await CommunityModel.findOne({ name: subreddit, isDeleted: false })

    if (!community) {
      return res.status(404).json({
        message: 'Community not found'
      })
    }

    return res.status(200).json(community.rules)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: 'Error getting rules: ' + error
    })
  }
}

const updateCommunityRules = async (req, res) => {
  try {
    const subreddit = req.params.communityName
    const rules = req.body.rules

    if (!rules) {
      return res.status(400).json({
        message: 'Rules are required'
      })
    }

    if (!subreddit) {
      return res.status(400).json({
        message: 'Subreddit is required'
      })
    }

    let community = await CommunityModel.findOne({ name: subreddit, isDeleted: false })

    if (!community) {
      return res.status(404).json({
        message: 'Community not found'
      })
    }

    community.rules = rules
    await community.save()

    community = await CommunityModel.findOne({ name: subreddit, isDeleted: false })

    return res.status(200).json(community.rules)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: 'Error updating rules: ' + error
    })
  }
}

const getCommunitySettings = async (req, res) => {
  try {
    const subreddit = req.params.communityName

    if (!subreddit) {
      return res.status(400).json({
        message: 'Subreddit is required'
      })
    }

    const community = await CommunityModel.findOne({ name: subreddit, isDeleted: false })

    if (!community) {
      return res.status(404).json({
        message: 'Community not found'
      })
    }

    return res.status(200).json(community.settings)
  } catch (error) {
    console.log(error)
    res.status(500).json({
      message: 'Error getting settings: ' + error
    })
  }
}

const updateCommunitySettings = async (req, res) => {
  try {
    const subreddit = req.params.communityName
    const settings = req.body.settings

    if (!settings) {
      return res.status(400).json({
        message: 'Settings are required'
      })
    }

    if (!subreddit) {
      return res.status(400).json({
        message: 'Subreddit is required'
      })
    }

    let community = await CommunityModel.findOne({ name: subreddit, isDeleted: false })

    if (!community) {
      return res.status(404).json({
        message: 'Community not found'
      })
    }

    if (settings.allowedPostTypes) community.settings.allowedPostTypes = settings.allowedPostTypes
    if (settings.allowCrossPosting !== undefined) community.settings.allowCrossPosting = settings.allowCrossPosting
    if (settings.allowSpoiler !== undefined) community.settings.allowSpoiler = settings.allowSpoiler
    if (settings.allowImages !== undefined) community.settings.allowImages = settings.allowImages
    if (settings.allowPolls !== undefined) community.settings.allowPolls = settings.allowPolls
    if (settings.suggestedSort) community.settings.suggestedSort = settings.suggestedSort
    if (settings.allowImageComments !== undefined) community.settings.allowImageComments = settings.allowImageComments

    await community.save()

    community = await CommunityModel.findOne({ name: subreddit, isDeleted: false })

    return res.status(200).json(community.settings)
  } catch (error) {
    console.log(error)
    res.status(500).json({
      message: 'Error updating settings: ' + error
    })
  }
}

const getScheduledPosts = async (req, res) => {
  try {
    const subreddit = req.params.communityName

    if (!subreddit) {
      return res.status(400).json({
        message: 'Subreddit is required'
      })
    }

    const community = await CommunityModel.findOne({ name: subreddit, isDeleted: false })

    if (!community) {
      return res.status(404).json({
        message: 'Community not found'
      })
    }

    const user = await UserModel.findOne({ username: req.decoded.username, isDeleted: false })

    if (!user) {
      return res.status(404).json({
        message: 'User does not exist'
      })
    }

    const page = req.query.page ? parseInt(req.query.page) - 1 : 0
    const limit = req.query.limit ? parseInt(req.query.limit) : 10

    const options = {
      page,
      limit
    }

    const scheduledPosts = await PostModel.getScheduledPosts(subreddit, options)

    return res.status(200).json(scheduledPosts)
  } catch (error) {
    console.log(error)
    res.status(500).json({
      message: 'An error occurred while getting scheduled posts'
    })
  }
}

const getUnmoderatedPosts = async (req, res) => {
  try {
    const subreddit = req.params.communityName

    if (!subreddit) {
      return res.status(400).json({
        message: 'Subreddit is required'
      })
    }

    const community = await CommunityModel.findOne({ name: subreddit, isDeleted: false })

    if (!community) {
      return res.status(404).json({
        message: 'Community not found'
      })
    }

    const user = await UserModel.findOne({ username: req.decoded.username, isDeleted: false })

    if (!user) {
      return res.status(404).json({
        message: 'User does not exist'
      })
    }

    const page = req.query.page ? parseInt(req.query.page) - 1 : 0
    const limit = req.query.limit ? parseInt(req.query.limit) : 10
    const sort = req.query.sort ? req.query.sort : 'new'
    const sortMethod = getSortingMethod(sort)

    const options = {
      page,
      limit,
      sortMethod
    }

    const unmoderatedPosts = await PostModel.getUnmoderatedPosts(subreddit, options)

    unmoderatedPosts.forEach(post => {
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
    })

    return res.status(200).json(unmoderatedPosts)
  } catch (error) {
    console.log(error)
    res.status(500).json({
      message: 'An error occurred while getting unmoderated posts'
    })
  }
}

const updateCommunityBanner = async (req, res) => {
  try {
    const communityName = req.params.communityName
    if (!req.files || !req.files.image) {
      return res.status(400).json({
        message: 'Banner is required'
      })
    }

    if (!communityName) {
      return res.status(400).json({
        message: 'Community name is required'
      })
    }

    const community = await CommunityModel.findOne({ name: communityName, isDeleted: false })

    if (!community) {
      return res.status(404).json({
        message: 'Community not found'
      })
    }

    const banner = req.files.image

    const urls = community.banner ? [community.banner] : []
    await MediaUtils.deleteImages(urls)
    const newBanner = await MediaUtils.uploadImages(banner)
    community.banner = newBanner[0]

    await community.save()
    return res.status(200).json({ link: community.banner })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: 'Error updating banner: ' + error.message
    })
  }
}

const updateCommunityIcon = async (req, res) => {
  try {
    const communityName = req.params.communityName
    if (!req.files || !req.files.image) {
      return res.status(400).json({
        message: 'Icon is required'
      })
    }

    if (!communityName) {
      return res.status(400).json({
        message: 'Community name is required'
      })
    }

    const community = await CommunityModel.findOne({ name: communityName, isDeleted: false })

    if (!community) {
      return res.status(404).json({
        message: 'Community not found'
      })
    }

    const icon = req.files.image

    const urls = community.icon ? [community.icon] : []
    await MediaUtils.deleteImages(urls)
    const newIcon = await MediaUtils.uploadImages(icon)
    community.icon = newIcon[0]

    await community.save()
    return res.status(200).json({ link: community.icon })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: 'Error updating icon: ' + error.message
    })
  }
}

module.exports = {
  createCommunity,
  getCommunityView,
  isNameAvailable,
  getTopCommunities,
  getEditedPosts,
  getSortedCommunityPosts,
  joinCommunity,
  leaveCommunity,
  muteCommunity,
  getReportedPosts,
  getCommunityRules,
  updateCommunityRules,
  getCommunitySettings,
  updateCommunitySettings,
  getScheduledPosts,
  getUnmoderatedPosts,
  updateCommunityBanner,
  updateCommunityIcon
}
