const UserModel = require('../models/User')
const PostModel = require('../models/Post')

const searchUsers = async (req, res) => {
  const { page, limit, query } = req.query

  const option = {
    query,
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 10
  }

  const users = await UserModel.searchUsers(option)

  console.log(users)
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

  const users = await PostModel.searchPosts(option)

  console.log(users)
  res.status(200).json(users)
}

module.exports = {
  searchUsers,
  searchPosts
}
