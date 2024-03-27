const bcrypt = require('bcrypt')
const crypto = require('crypto')
const emailValidator = require('email-validator')
const UserModel = require('../models/User')
const { sendEmail, sendVerificationEmail } = require('../utils/Email')
const dotenv = require('dotenv')

dotenv.config()

const follow = async (req, res) => {
  try {
    const { username } = req.params

    if (!username) {
      return res.status(400).json({
        message: 'Username is required'
      })
    }

    const user = await UserModel.findOne({ username: req.decoded.username, isDeleted: false })

    if (!user) {
      return res.status(404).json({
        message: 'User does not exist'
      })
    }

    const userFollowed = await UserModel.findOne({ username, isDeleted: false })
    if (!userFollowed) {
      return res.status(404).json({
        message: 'User to be followed does not exist'
      })
    }

    if (user.username === userFollowed.username) {
      return res.status(400).json({
        message: 'User cannot follow themselves'
      })
    }

    if (user.follows.includes(userFollowed.username)) {
      return res.status(400).json({
        message: 'User already follows the user'
      })
    }

    if (userFollowed.followers.includes(user.username)) {
      return res.status(400).json({
        message: 'User already is being followed by the user'
      })
    }

    user.follows.push(userFollowed.username)
    userFollowed.followers.push(user.username)

    await user.save()
    await userFollowed.save()

    res.status(200).json({
      message: 'User followed'
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: 'An error occurred while following the user'
    })
  }
}

const unfollow = async (req, res) => {
  try {
    const { username } = req.params

    if (!username) {
      return res.status(400).json({
        message: 'Username is required'
      })
    }

    const user = await UserModel.findOne({ username: req.decoded.username, isDeleted: false })

    if (!user) {
      return res.status(404).json({
        message: 'User does not exist'
      })
    }

    const userUnfollowed = await UserModel.findOne({ username, isDeleted: false })
    if (!userUnfollowed) {
      return res.status(404).json({
        message: 'User to be unfollowed does not exist'
      })
    }

    if (user.username === userUnfollowed.username) {
      return res.status(400).json({
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
      message: 'User unfollowed'
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: 'An error occurred while unfollowing the user'
    })
  }
}

const block = async (req, res) => {
  try {
    const { username } = req.params

    if (!username) {
      return res.status(400).json({
        message: 'Username is required'
      })
    }

    const user = await UserModel.findOne({ username: req.decoded.username, isDeleted: false })

    if (!user) {
      return res.status(404).json({
        message: 'User does not exist'
      })
    }

    const userBlocked = await UserModel.findOne({ username, isDeleted: false })
    if (!userBlocked) {
      return res.status(404).json({
        message: 'User to be blocked does not exist'
      })
    }

    if (user.username === userBlocked.username) {
      return res.status(400).json({
        message: 'User cannot block themselves'
      })
    }

    if (user.blockedUsers.includes(userBlocked.username)) {
      return res.status(400).json({
        message: 'User already blocks the user'
      })
    }

    user.blockedUsers.push(userBlocked.username)

    await user.save()

    res.status(200).json({
      message: 'User blocked'
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: 'An error occurred while blocking the user'
    })
  }
}

const unblock = async (req, res) => {
  try {
    const { username } = req.params

    if (!username) {
      return res.status(400).json({
        message: 'Username is required'
      })
    }

    const user = await UserModel.findOne({ username: req.decoded.username, isDeleted: false })

    if (!user) {
      return res.status(404).json({
        message: 'User does not exist'
      })
    }

    const userUnblocked = await UserModel.findOne({ username, isDeleted: false })
    if (!userUnblocked) {
      return res.status(404).json({
        message: 'User to be unblocked does not exist'
      })
    }

    if (user.username === userUnblocked.username) {
      return res.status(400).json({
        message: 'User cannot unblock themselves'
      })
    }

    user.blockedUsers = user.blockedUsers.filter(
      (unblock) => unblock !== userUnblocked.username
    )

    await user.save()

    res.status(200).json({
      message: 'User unblocked'
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: 'An error occurred while unblocking the user'
    })
  }
}

const isUsernameAvailable = async (req, res) => {
  try {
    const { username } = req.params

    if (!username) {
      return res.status(400).json({
        message: 'Username is required'
      })
    }

    const user = await UserModel.findOne({ username })

    if (!user) {
      return res.status(200).json({
        message: 'Username is available',
        available: true
      })
    } else {
      return res.status(409).json({
        message: 'Username is not available',
        available: false
      })
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: 'An error occurred while checking if the username is available'
    })
  }
}

const forgotPassword = async (req, res) => {
  if (!req.body.username || !req.body.email) {
    return res.status(400).json({ message: 'Username and Email are required' })
  }
  const user = await UserModel.findOne({
    username: req.body.username,
    email: req.body.email,
    isDeleted: false
  })

  if (!user) {
    return res.status(404).json({ message: 'Username or Email not found' })
  }

  const resetToken = await user.createResetPasswordToken()
  await user.save()

  const resetURL = `${req.protocol}://${req.get('host')}/user/reset-password/${resetToken}`
  const message = `Forgot your password? No problem! You can reset your password using the lovely url below\n\n ${resetURL}\n\nIf you didn't forget your password, please ignore this email!`

  try {
    await sendEmail(user.email, 'Ask and you shall receive a password reset', message)
    return res.status(200).json({ message: 'Reset password has been sent to the user successfully' })
  } catch (error) {
    user.resetPasswordToken = undefined
    user.resetPasswordTokenExpire = undefined
    await user.save()
    return res.status(500).json({ message: 'There was an error sending the email. Try again later' })
  }
}

const validatePassword = async (password) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\w!@#$%^&*()\-_=+\\|[\]{};:'",.<>/?`~ ])[\w!@#$%^&*()\-_=+\\|[\]{};:'",.<>/?`~ ]{8,}$/
  return passwordRegex.test(password)
}

const resetPassword = async (req, res) => {
  const { token } = req.params
  if (!token) {
    return res.status(400).json({ message: 'Token, password, and confirm password are required' })
  }

  const encryptedToken = crypto.createHash('sha256').update(token).digest('hex')
  const user = await UserModel.findOne({ resetPasswordToken: encryptedToken, isDeleted: false })

  if (!user) {
    return res.status(400).json({ message: 'Token is invalid' })
  }

  if (user.resetPasswordTokenExpire < Date.now()) {
    return res.status(400).json({ message: 'Token has expired' })
  }

  const { password, confirmPassword } = req.body
  if (!password || !confirmPassword) {
    return res.status(400).json({ message: 'Please provide all inputs required' })
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' })
  }

  if (!validatePassword(password)) {
    return res.status(400).json({ message: 'Password must contain at least one lower and upper case letters and at least one digit and must be at least 8 characters' })
  }

  const salt = await bcrypt.genSalt(10)
  user.password = await bcrypt.hash(password, salt)
  user.passwordChangedAt = Date.now()
  user.resetPasswordToken = undefined
  user.resetPasswordTokenExpire = undefined

  await user.save()

  return res.status(200).json({ message: 'Password has been reset successfully' })
}

const forgotUsername = async (req, res) => {
  if (!req.body.email) {
    return res.status(400).json({ message: 'Email is required' })
  }
  const user = await UserModel.findOne({ email: req.body.email, isDeleted: false })

  if (!user) {
    return res.status(404).json({ message: 'Email not found' })
  }

  const message = `Hey there,\n\nYou forgot it didn't you? No worries. Here you go:\n\nYour username is: ${user.username}\n\n(Username checks out, nicely done.)\n\nIf you didn't forget your username, please ignore this email!`

  try {
    await sendEmail(user.email, 'So you wanna know your Reddit username, huh?', message)
    return res.status(200).json({ message: 'Username has been sent to the user successfully' })
  } catch (error) {
    return res.status(500).json({ message: 'There was an error sending the email. Try again later' })
  }
}

const changePassword = async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body

  if (!oldPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: 'Old password, new password and confirm password are required' })
  }

  const user = await UserModel.findOne({ username: req.decoded.username, isDeleted: false })

  if (!user) {
    return res.status(404).json({ message: 'User not found' })
  }

  const isPasswordCorrect = await bcrypt.compare(oldPassword, user.password)

  if (!isPasswordCorrect) {
    return res.status(400).json({ message: 'Old password is incorrect' })
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: 'new password must match with confirm password' })
  }

  if (!validatePassword(newPassword)) {
    return res.status(400).json({ message: 'Password must contain at least one lower and upper case letters and at least one digit and must be at least 8 characters' })
  }

  if (newPassword === oldPassword) {
    return res.status(400).json({ message: 'New password must be different from the old password' })
  }

  const salt = await bcrypt.genSalt(10)
  user.password = await bcrypt.hash(newPassword, salt)
  user.passwordChangedAt = Date.now()
  await user.save()

  return res.status(200).json({ message: 'Password has been changed successfully' })
}

const changeEmail = async (req, res) => {
  if (!req.body.password || !req.body.newEmail) {
    return res.status(400).json({ message: 'Password and new email are required' })
  }

  const user = await UserModel.findOne({ username: req.decoded.username, isDeleted: false })

  if (user.password === null || user.password === '') {
    // we will send an email to the user to reset the password according to reddit's policy
    req.body.email = user.email
    req.body.username = user.username
    return this.forgetPassword(req, res)
  } else {
    const { password, newEmail } = req.body

    const isPasswordCorrect = await bcrypt.compare(password, user.password)
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: 'Password is incorrect' })
    }

    if (!emailValidator.validate(newEmail)) {
      return res.status(400).json({ message: 'Email is invalid' })
    }

    if (user.email === newEmail) {
      return res.status(400).json({ message: 'New email must be different from the old email' })
    }

    user.email = newEmail
    await user.save()

    await sendVerificationEmail(newEmail, user.username)

    return res.status(200).json({ message: 'Email has been changed successfully' })
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

    res.status(200).json({ message: 'Settings updated successfully' })
  } catch (error) {
    console.error('Error updating user settings:', error)
    res.status(400).json({ message: 'Error updating settings: ' + error.message })
  }
}

const getSaved = async (req, res) => {
  try {
    const username = req.decoded.username
    if (!username) {
      throw new Error('Username is required')
    }
    const user = await UserModel.findOne({ username: username, isDeleted: false })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10

    const options = {
      username: username,
      unwind: '$savedPosts',
      localField: 'savedPosts.postId',
      savedAt: '$savedPosts.savedAt',
      page: page,
      limit: limit
    }

    const savedPosts = await user.getPosts(options)
    const savedComments = await user.getSavedComments()
    const sortedArray = [...savedPosts, ...savedComments].sort((a, b) => {
      return new Date(b.savedAt) - new Date(a.savedAt)
    })

    const paginatedArray = sortedArray.slice((page - 1) * limit, page * limit)

    res.status(200).json(paginatedArray)
  } catch (error) {
    res.status(500).json({ message: 'Error getting saved posts' })
  }
}

const getHiddenPosts = async (req, res) => {
  try {
    const username = req.decoded.username
    if (!username) {
      throw new Error('Username is required')
    }
    const user = await UserModel.findOne({ username: username, isDeleted: false })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10

    const options = {
      username: username,
      unwind: '$hiddenPosts',
      localField: 'hiddenPosts.postId',
      savedAt: '$hiddenPosts.savedAt',
      page: page,
      limit: limit
    }

    const result = await user.getPosts(options)
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({ message: 'Error getting hidden posts' })
  }
}

module.exports = {
  follow,
  unfollow,
  block,
  unblock,
  isUsernameAvailable,
  forgotPassword,
  resetPassword,
  forgotUsername,
  changePassword,
  changeEmail,
  getUserView,
  getSettings,
  updateSettings,
  getSaved,
  getHiddenPosts
}
