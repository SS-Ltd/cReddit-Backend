const UserModel = require('../models/User')
const PostModel = require('../models/Post')
const CommunityModel = require('../models/Community')
const { getSortingMethod, filterWithTime } = require('./Post')

const searchUsers = async (req, res) => {
  const { page, limit, query, safeSearch, autocomplete } = req.query
  if (!query) return res.status(400).json({ error: 'Query is required' })
  const option = {
    query,
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 10,
    safeSearch: safeSearch === 'true',
    autocomplete: autocomplete === 'true'
  }

  const users = await UserModel.searchUsers(option)

  res.status(200).json(users)
}

const searchPosts = async (req, res) => {
  const { page, limit, query, safeSearch, community, user, sort, time } = req.query
  if (!query) return res.status(400).json({ error: 'Query is required' })
  const option = {
    query,
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 10,
    safeSearch: safeSearch === 'true',
    community,
    user,
    sortMethod: getSortingMethod(sort),
    filter: filterWithTime(time)
  }

  const posts = await PostModel.searchPosts(option)

  res.status(200).json(posts)
}

const searchComments = async (req, res) => {
  const { page, limit, query, safeSearch, community, user, sort } = req.query
  if (!query) return res.status(400).json({ error: 'Query is required' })
  const option = {
    query,
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 10,
    safeSearch: safeSearch === 'true',
    community,
    user,
    sortMethod: getSortingMethod(sort)
  }

  const comments = await PostModel.searchComments(option)

  res.status(200).json(comments)
}

const searchCommunities = async (req, res) => {
  const { page, limit, query, safeSearch } = req.query
  if (!query) return res.status(400).json({ error: 'Query is required' })
  const option = {
    query,
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 10,
    safeSearch: safeSearch === 'true'
  }

  const communities = await CommunityModel.searchCommunities(option)

  res.status(200).json(communities)
}

module.exports = {
  searchUsers,
  searchPosts,
  searchComments,
  searchCommunities
}
