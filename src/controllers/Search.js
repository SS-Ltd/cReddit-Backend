const UserModel = require('../models/User')

const searchUsers = async (req, res) => {
  const { page, limit, query } = req.query

  const option = {
    query,
    page: page || 1,
    limit: limit || 10
  }

  const users = await UserModel.searchUsers(option)

  console.log(users)
  res.status(200).json(users)
}

module.exports = {
  searchUsers
}
