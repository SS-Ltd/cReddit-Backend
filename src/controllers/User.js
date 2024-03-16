const bcrypt = require('bcrypt')
const UserModel = require('../models/User')
const sendEmail = require('../utils/Email')
const dotenv = require('dotenv')

dotenv.config()

const follow = async (req, res) => {
  try {
    const { username } = req.params

    if (!username) {
      return res.status(400).json({
        status: 'Bad Request',
        message: 'Username is required'
      })
    }

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

const unfollow = async (req, res) => {
  try {
    const { username } = req.params

    if (!username) {
      return res.status(400).json({
        status: 'Bad Request',
        message: 'Username is required'
      })
    }

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

const block = async (req, res) => {
  try {
    const { username } = req.params

    if (!username) {
      return res.status(400).json({
        status: 'Bad Request',
        message: 'Username is required'
      })
    }

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

const unblock = async (req, res) => {
  try {
    const { username } = req.params

    if (!username) {
      return res.status(400).json({
        status: 'Bad Request',
        message: 'Username is required'
      })
    }

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

const isUsernameAvailable = async (req, res) => {
  try {
    const { username } = req.params

    if (!username) {
      return res.status(400).json({
        status: 'Bad Request',
        message: 'Username is required'
      })
    }

    const user = await UserModel.findOne({ username })

    if (!user) {
      return res.status(200).json({
        status: 'OK',
        message: 'Username is available',
        available: true
      })
    } else {
      return res.status(409).json({
        status: 'Conflict',
        message: 'Username is not available',
        available: false
      })
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({
      status: 'Internal Server Error',
      message: 'An error occurred while checking if the username is available'
    })
  }
}

const forgetPassword = async (req, res, next) => {
  // 1) Check if the user exists with the username and email provided
  const user = await UserModel.findOne({ username: req.body.username, email: req.body.email })

  if (!user) {
    res.status(404).json({ message: 'Username or Email not found' })
    return next(new Error('Username or Email not found'))
  }
  // 2) Generate reset token
  const resetToken = await user.createResetPasswordToken()
  await user.save()

  // 3) Send to user's email the reset token
  const resetURL = `${req.protocol}://${req.get('host')}/user/reset-password/${resetToken}`
  const message = `Forgot your password? No problem! You can reset your password using the lovely url below\n\n ${resetURL}\n\nIf you didn't forget your password, please ignore this email!`

  try {
    await sendEmail({
      email: user.email,
      subject: 'Ask and you shall receive a password reset',
      message
    })

    return res.status(200).json({ message: 'Reset password has been sent to the user successfully' })
  } catch (error) {
    // Deleting the reset token for the user
    user.passwordResetToken = undefined
    user.resetPasswordTokenExpire = undefined
    await user.save()
    res.status(500).json({ message: 'There was an error sending the email. Try again later' })
    return next(new Error('There was an error sending the email. Try again later'))
  }
}

const resetPassword = async (req, res, next) => {
  // 1) Get user based on the token but keep in mind that the token is stored in the database as a hashed value
  const user = await UserModel.findOne({ resetPasswordTokenExpire: { $gt: Date.now() } })

  if (!user) {
    res.status(400).json({ message: 'Token has expired' })
    return next(new Error('Token has expired'))
  }

  const isTokenValid = await bcrypt.compare(req.params.token, user.resetPasswordToken)
  if (!isTokenValid) {
    return res.status(400).json({ message: 'Token is invalid' })
  }

  // 2) Set the new password
  const resetPassword = req.body.password
  const confirmPassword = req.body.confirmPassword
  if (resetPassword !== confirmPassword) {
    res.status(400).json({ message: 'Passwords do not match' })
    return next(new Error('Passwords do not match'))
  }

  const salt = await bcrypt.genSalt(10)
  user.password = await bcrypt.hash(resetPassword, salt)
  user.passwordChangedAt = Date.now()
  user.resetPasswordToken = undefined
  user.resetPasswordTokenExpire = undefined

  await user.save()

  return res.status(200).json({ message: 'Password has been reset successfully' })
}

const forgotUsername = async (req, res, next) => {
  // 1) Check if the user exists with the email provided
  const user = await UserModel.findOne({ email: req.body.email })

  if (!user) {
    res.status(404).json({ message: 'Email not found' })
    return next(new Error('Email not found'))
  }

  // 2) Send to user's email the username
  const message = `Hey there,\n\nYou forgot it didn't you? No worries. Here you go:\n\nYour username is: ${user.username}\n\n(Username checks out, nicely done.)\n\nIf you didn't forget your username, please ignore this email!`

  try {
    await sendEmail({
      email: user.email,
      subject: 'So you wanna know your Reddit username, huh?',
      message
    })

    return res.status(200).json({ message: 'Username has been sent to the user successfully' })
  } catch (error) {
    res.status(500).json({ message: 'There was an error sending the email. Try again later' })
    return next(new Error('There was an error sending the email. Try again later'))
  }
}

const getUserView = async (req, res) => {
  try {
    if (!req.params.username) {
      throw new Error('Username is required')
    }
    const user = await UserModel.findOne({ username: req.params.username })
    if (!user || user.isDeleted) {
      return res.status(404).json({ message: 'User not found' })
    }
    res.status(200).json({
      username: user.username,
      displayName: user.displayName,
      about: user.about,
      email: user.email,
      profilePicture: user.profilePicture,
      banner: user.banner,
      followers: user.followers.length,
      cakeDay: user.createdAt
    })
  } catch (error) {
    res.status(400).json({ message: 'Error getting user view: ' + error.message })
  }
}

const getSettings = async (req, res) => {
  try {
    const username = req.decoded.username
    if (!username) {
      throw new Error('Username is required')
    }
    const user = await UserModel.findOne({ username: username })
    if (!user || user.isDeleted) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.status(200).json({
      account: {
        email: user.email,
        gender: user.gender,
        google: user.preferences.google !== null
      },
      profile: {
        displayName: user.displayName,
        about: user.about,
        socialLinks: user.preferences.socialLinks,
        avatar: user.profilePicture,
        banner: user.banner,
        isNSFW: user.preferences.isNSFW,
        allowFollow: user.preferences.allowFollow,
        isContentVisible: user.preferences.isContentVisible
      },
      safetyAndPrivacy: {
        blockedUsers: user.blockedUsers,
        mutedCommunities: user.mutedCommunities
      },
      feedSettings: {
        showAdultContent: user.preferences.showAdultContent,
        autoPlayMedia: user.preferences.autoPlayMedia,
        communityThemes: user.preferences.communityThemes,
        communityContentSort: user.preferences.communityContentSort,
        globalContentView: user.preferences.globalContentView,
        openNewTab: user.preferences.openNewTab
      },
      notifications: {
        mentionsNotifs: user.preferences.mentionsNotifs,
        commentsNotifs: user.preferences.commentsNotifs,
        postsUpvotesNotifs: user.preferences.postsUpvotesNotifs,
        repliesNotifs: user.preferences.repliesNotifs,
        newFollowersNotifs: user.preferences.newFollowersNotifs,
        postNotifs: user.preferences.postNotifs,
        cakeDayNotifs: user.preferences.cakeDayNotifs,
        modNotifs: user.preferences.modNotifs,
        moderatorInCommunities: user.moderatorInCommunities,
        invitationNotifs: user.preferences.invitationNotifs
      },
      email: {
        followEmail: user.preferences.followEmail,
        chatEmail: user.preferences.chatEmail
      }
    })
  } catch (error) {
    res.status(400).json({ message: 'Error getting settings: ' + error.message })
  }
}

const updateSettings = async (req, res) => {
  try {
    const username = req.decoded.username
    if (!username) {
      throw new Error('Username is required')
    }

    const user = await UserModel.findOne({ username: username })
    if (!user || user.isDeleted) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (req.body.preferences && typeof req.body.preferences === 'object') {
      if (req.body.preferences.socialLinks && typeof req.body.preferences.socialLinks !== 'object') {
        throw new Error('Invalid socialLinks type')
      }

      // Update preferences
      user.preferences = { ...user.preferences, ...req.body.preferences }
    }

    // Update other user fields
    for (const key in req.body) {
      if (key !== 'preferences') {
        user[key] = req.body[key]
      }
    }

    // Save user changes
    await user.save()

    res.status(200).json({ message: 'Settings updated successfully'})
  } catch (error) {
    console.error('Error updating user settings:', error)
    res.status(400).json({ message: 'Error updating settings: ' + error.message })
  }
}

module.exports = {
  follow,
  unfollow,
  block,
  unblock,
  isUsernameAvailable,
  forgetPassword,
  resetPassword,
  forgotUsername,
  getUserView,
  getSettings,
  updateSettings
}
