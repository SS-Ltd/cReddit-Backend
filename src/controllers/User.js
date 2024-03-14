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
        message: 'User to be followed does not exist'
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
        message: 'User to be unfollowed does not exist'
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

module.exports.block = async (req, res) => {
  try {
    const { username } = req.params

    const user = await UserModel.findOne({ username: req.decoded.username, isDeleted: false })

    if (!user) {
      return res.status(404).json({
        status: 'Not Found',
        message: 'User does not exist'
      })
    }

    const userBlocked = await UserModel.findOne({ username, isDeleted: false })
    if (!userBlocked) {
      return res.status(404).json({
        status: 'Not Found',
        message: 'User to be blocked does not exist'
      })
    }

    if (user.username === userBlocked.username) {
      return res.status(400).json({
        status: 'Bad Request',
        message: 'User cannot block themselves'
      })
    }

    if (user.blockedUsers.includes(userBlocked.username)) {
      return res.status(400).json({
        status: 'Bad Request',
        message: 'User already blocks the user'
      })
    }

    user.blockedUsers.push(userBlocked.username)

    await user.save()

    res.status(200).json({
      status: 'OK',
      message: 'User blocked'
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      status: 'Internal Server Error',
      message: 'An error occurred while blocking the user'
    })
  }
}

module.exports.unblock = async (req, res) => {
  try {
    const { username } = req.params

    const user = await UserModel.findOne({ username: req.decoded.username, isDeleted: false })

    if (!user) {
      return res.status(404).json({
        status: 'Not Found',
        message: 'User does not exist'
      })
    }

    const userUnblocked = await UserModel.findOne({ username, isDeleted: false })
    if (!userUnblocked) {
      return res.status(404).json({
        status: 'Not Found',
        message: 'User to be unblocked does not exist'
      })
    }

    if (user.username === userUnblocked.username) {
      return res.status(400).json({
        status: 'Bad Request',
        message: 'User cannot unblock themselves'
      })
    }

    user.blockedUsers = user.blockedUsers.filter(
      (unblock) => unblock !== userUnblocked.username
    )

    await user.save()

    res.status(200).json({
      status: 'OK',
      message: 'User unblocked'
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      status: 'Internal Server Error',
      message: 'An error occurred while unblocking the user'
    })
  }
}
