const UserModel = require('../models/User')
const PostModel = require('../models/Post')
const CommunityModel = require('../models/Community')

const searchUsers = async (req, res) => {
  const { page, limit, query, safeSearch } = req.query

  const option = {
    query,
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 10,
    safeSearch: safeSearch === 'true'
  }

  const users = await UserModel.searchUsers(option)

  res.status(200).json(users)
}

const searchPosts = async (req, res) => {
  const { page, limit, query, safeSearch, community, user } = req.query

  const option = {
    query,
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 10,
    safeSearch: safeSearch === 'true',
    community,
    user
  }

  const posts = await PostModel.searchPosts(option)

  res.status(200).json(posts)
}

const searchComments = async (req, res) => {
  const { page, limit, query, safeSearch, community, user } = req.query

  const option = {
    query,
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 10,
    safeSearch: safeSearch === 'true',
    community,
    user
  }

  const comments = await PostModel.searchComments(option)

  res.status(200).json(comments)
}

const searchCommunities = async (req, res) => {
  const { page, limit, query, safeSearch } = req.query

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
