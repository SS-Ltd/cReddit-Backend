const UserModel = require('../models/User')
const dotenv = require('dotenv')

dotenv.config()

module.exports.follow = async (req, res) => {
  try {
    const { username } = req.params

    const user = await UserModel.findOne({ username: req.decoded.username, isDeleted: false })

    if (!user) {
      return res.status(404).json({
        status: 'Not Found',
        message: 'User does not exist'
      })
    }

    const userFollowed = await UserModel.findOne({ username, isDeleted: false })
    if (!userFollowed) {
      return res.status(404).json({
        status: 'Not Found',
        message: 'Followed user does not exist'
      })
    }

    if (user.username === userFollowed.username) {
      return res.status(400).json({
        status: 'Bad Request',
        message: 'User cannot follow themselves'
      })
    }

    if (user.follows.includes(userFollowed.username)) {
      return res.status(400).json({
        status: 'Bad Request',
        message: 'User already follows the user'
      })
    }

    if (userFollowed.followers.includes(user.username)) {
      return res.status(400).json({
        status: 'Bad Request',
        message: 'User already is being followed by the user'
      })
    }

    user.follows.push(userFollowed.username)
    userFollowed.followers.push(user.username)

    await user.save()
    await userFollowed.save()

    res.status(200).json({
      status: 'OK',
      message: 'User followed'
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      status: 'Internal Server Error',
      message: 'An error occurred while following the user'
    })
  }
}

module.exports.unfollow = async (req, res) => {
  try {
    const { username } = req.params

    const user = await UserModel.findOne({ username: req.decoded.username, isDeleted: false })

    if (!user) {
      return res.status(404).json({
        status: 'Not Found',
        message: 'User does not exist'
      })
    }

    const userUnfollowed = await UserModel.findOne({ username, isDeleted: false })
    if (!userUnfollowed) {
      return res.status(404).json({
        status: 'Not Found',
        message: 'User does not exist'
      })
    }

    if (user.username === userUnfollowed.username) {
      return res.status(400).json({
        status: 'Bad Request',
        message: 'User cannot unfollow themselves'
      })
    }

    user.follows = user.follows.filter(
      (follow) => follow !== userUnfollowed.username
    )
    userUnfollowed.followers = userUnfollowed.followers.filter(
      (follower) => follower !== user.username
    )

    await user.save()
    await userUnfollowed.save()

    res.status(200).json({
      status: 'OK',
      message: 'User unfollowed'
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      status: 'Internal Server Error',
      message: 'An error occurred while unfollowing the user'
    })
  }
}
