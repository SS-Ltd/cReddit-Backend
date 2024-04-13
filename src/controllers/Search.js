const UserModel = require('../models/User')
const PostModel = require('../models/Post')

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
  const { page, limit, query, safeSearch } = req.query

  const option = {
    query,
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 10,
    safeSearch: safeSearch === 'true'
  }

  const posts = await PostModel.searchPosts(option)

  res.status(200).json(posts)
}

const searchComments = async (req, res) => {
  const { page, limit, query, safeSearch } = req.query

  const option = {
    query,
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 10,
    safeSearch: safeSearch === 'true'
  }

  const comments = await PostModel.searchComments(option)

  res.status(200).json(comments)
}

module.exports = {
  searchUsers,
  searchPosts,
  searchComments
}
