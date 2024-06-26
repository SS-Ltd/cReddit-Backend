const bcrypt = require('bcrypt')
const crypto = require('crypto')
const emailValidator = require('email-validator')
const UserModel = require('../models/User')
const HistoryModel = require('../models/History')
const CommunityModel = require('../models/Community')
const PostModel = require('../models/Post')
const MediaUtils = require('../utils/Media')
const { sendEmail, sendVerificationEmail } = require('../utils/Email')
const { sendNotification } = require('../utils/Notification')
const { faker } = require('@faker-js/faker')
const dotenv = require('dotenv')

dotenv.config()

const getUser = async (req, res) => {
  try {
    const username = req.decoded.username
    if (!username) {
      return res.status(401).json({ message: 'Unauthorized, user must be logged in' })
    }

    const user = await UserModel.findOne({ username: username })
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
      cakeDay: user.createdAt,
      isNSFW: user.preferences.isNSFW,
      showAdultContent: user.preferences.showAdultContent
    })
  } catch (error) {
    res.status(400).json({ message: 'Error getting user: ' + error.message })
  }
}

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

    if (userFollowed.blockedUsers.includes(user.username) || userFollowed.preferences.allowFollow === false) {
      return res.status(400).json({
        message: 'Cannot follow the user'
      })
    }

    user.follows.push(userFollowed.username)
    userFollowed.followers.push(user.username)

    await user.save()
    await userFollowed.save()

    if (userFollowed.preferences.newFollowerNotifs) {
      sendNotification(userFollowed.username, 'follow', user, user.username)
    }

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
    user.follows = user.follows.filter(
      (follow) => follow !== userBlocked.username
    )
    userBlocked.followers = userBlocked.followers.filter(
      (follower) => follower !== user.username
    )

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

const generateUsername = async (req, res) => {
  try {
    let username = faker.internet.userName()
    if (username.includes('.')) {
      username = username.replace('.', '_')
    }
    let user = await UserModel.findOne({ username })

    while (user) {
      username = faker.internet.userName()
      if (username.includes('.')) {
        username = username.replace('.', '_')
      }
      user = await UserModel.findOne({ username })
    }

    if (!user) {
      return res.status(200).json({
        message: 'Username generated',
        username: username
      })
    }
    throw new Error('Unable to generate username')
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: error
    })
  }
}

const forgotPassword = async (req, res) => {
  const { info } = req.body
  if (!info) {
    return res.status(400).json({ message: 'Username or Email is required' })
  }

  const user = await UserModel.findOne({ $or: [{ username: info }, { email: info }], isDeleted: false })
  if (!user) {
    return res.status(404).json({ message: 'User not found' })
  }

  const resetToken = await user.createResetPasswordToken()
  await user.save()

  const resetURL = `${req.protocol}://creddit.tech/passwordrecovery/${resetToken}`
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

const validatePassword = (password) => {
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

    await sendVerificationEmail(req, newEmail, user.username)

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
    const userData = {
      username: user.username,
      displayName: user.displayName,
      about: user.about,
      email: user.email,
      profilePicture: user.profilePicture,
      banner: user.banner,
      followers: user.followers.length,
      cakeDay: user.createdAt,
      isNSFW: user.preferences.isNSFW,
      allowFollow: user.preferences.allowFollow
    }
    if (req.decoded) {
      const viewer = await UserModel.findOne({ username: req.decoded.username })

      if (viewer && viewer.username !== user.username) {
        userData.isFollowed = viewer.follows.includes(user.username)
        userData.isBlocked = viewer.blockedUsers.includes(user.username)
      }
    }
    res.status(200).json(userData)
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

    const blocked = []
    if (user.blockedUsers.length > 0) {
      for (const blockedUser of user.blockedUsers) {
        const pfp = await UserModel.findOne({ username: blockedUser })
        blocked.push({
          username: blockedUser,
          profilePicture: pfp.profilePicture
        })
      }
    }

    const muted = []
    if (user.mutedCommunities.length > 0) {
      for (const mutedCommunity of user.mutedCommunities) {
        const pfp = await CommunityModel.findOne({ name: mutedCommunity })
        muted.push({
          name: mutedCommunity,
          profilePicture: pfp.icon
        })
      }
    }

    res.status(200).json({
      account: {
        email: user.email,
        gender: user.gender,
        google: user.preferences.google !== '' && user.preferences.google !== null,
        country: user.country
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
        blockedUsers: blocked,
        mutedCommunities: muted
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

    let user = await UserModel.findOne({ username: username })
    if (!user || user.isDeleted) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (req.body.account) {
      req.body.account = JSON.parse(req.body.account)
      const { gender, country } = req.body.account
      if (gender) user.gender = gender
      if (country) user.country = country
    }

    const blocked = [{}]
    user.blockedUsers.forEach(async (blockedUser) => {
      const pfp = await UserModel.findOne({ username: blockedUser })
      blocked.push({
        username: blockedUser,
        profilePicture: pfp.profilePicture
      })
    })

    const muted = [{}]

    user.mutedCommunities.forEach(async (mutedCommunity) => {
      const pfp = await CommunityModel.findOne({ name: mutedCommunity })
      muted.push({
        name: mutedCommunity,
        banner: pfp.banner
      })
    })

    if (req.body.profile) {
      req.body.profile = JSON.parse(req.body.profile)
      const {
        displayName,
        about,
        socialLinks,
        isNSFW,
        allowFollow,
        isContentVisible
      } = req.body.profile

      if (displayName) user.displayName = displayName
      if (about) user.about = about
      if (socialLinks) user.preferences.socialLinks = socialLinks
      if (isNSFW !== undefined) user.preferences.isNSFW = isNSFW
      if (allowFollow !== undefined) user.preferences.allowFollow = allowFollow
      if (isContentVisible !== undefined) user.preferences.isContentVisible = isContentVisible
    }

    if (req.files) {
      const { avatar, banner } = req.files
      if (avatar) {
        const urls = user.profilePicture ? [user.profilePicture] : []
        await MediaUtils.deleteImages(urls)
        const newAvatar = await MediaUtils.uploadImages(avatar)
        user.profilePicture = newAvatar[0]
      }
      if (banner) {
        const urls = user.banner ? [user.banner] : []
        await MediaUtils.deleteImages(urls)
        const newBanner = await MediaUtils.uploadImages(banner)
        user.banner = newBanner[0]
      }
    }

    if (req.body.feedSettings) {
      req.body.feedSettings = JSON.parse(req.body.feedSettings)
      const {
        showAdultContent,
        autoPlayMedia,
        communityThemes,
        communityContentSort,
        globalContentView,
        openNewTab
      } = req.body.feedSettings
      if (showAdultContent !== undefined) user.preferences.showAdultContent = showAdultContent
      if (autoPlayMedia !== undefined) user.preferences.autoPlayMedia = autoPlayMedia
      if (communityThemes !== undefined) user.preferences.communityThemes = communityThemes
      if (communityContentSort) user.preferences.communityContentSort = communityContentSort
      if (globalContentView) user.preferences.globalContentView = globalContentView
      if (openNewTab !== undefined) user.preferences.openNewTab = openNewTab
    }

    if (req.body.notifications) {
      req.body.notifications = JSON.parse(req.body.notifications)
      const {
        mentionsNotifs,
        commentsNotifs,
        postsUpvotesNotifs,
        repliesNotifs,
        newFollowersNotifs,
        postNotifs,
        cakeDayNotifs,
        modNotifs,
        moderatorInCommunities,
        invitationNotifs
      } = req.body.notifications
      if (mentionsNotifs !== undefined) user.preferences.mentionsNotifs = mentionsNotifs
      if (commentsNotifs !== undefined) user.preferences.commentsNotifs = commentsNotifs
      if (postsUpvotesNotifs !== undefined) user.preferences.postsUpvotesNotifs = postsUpvotesNotifs
      if (repliesNotifs !== undefined) user.preferences.repliesNotifs = repliesNotifs
      if (newFollowersNotifs !== undefined) user.preferences.newFollowersNotifs = newFollowersNotifs
      if (postNotifs !== undefined) user.preferences.postNotifs = postNotifs
      if (cakeDayNotifs !== undefined) user.preferences.cakeDayNotifs = cakeDayNotifs
      if (modNotifs !== undefined) user.preferences.modNotifs = modNotifs
      if (moderatorInCommunities) user.moderatorInCommunities = moderatorInCommunities
      if (invitationNotifs !== undefined) user.preferences.invitationNotifs = invitationNotifs
    }

    if (req.body.email) {
      req.body.email = JSON.parse(req.body.email)
      const { followEmail, chatEmail } = req.body.email
      if (followEmail !== undefined) user.preferences.followEmail = followEmail
      if (chatEmail !== undefined) user.preferences.chatEmail = chatEmail
    }

    // Save user changes
    await user.save()
    user = await UserModel.findOne({ username: username })

    res.status(200).json({
      account: {
        email: user.email,
        gender: user.gender,
        google: user.preferences.google !== null,
        country: user.country
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
        blockedUsers: blocked,
        mutedCommunities: muted
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
      localField: '$savedPosts.postId',
      searchType: req.searchType || 'All', // values can be 'All', 'Post', 'Comment'
      savedAt: '$savedPosts.savedAt',
      page: page,
      limit: limit
    }

    const savedContent = await user.getPosts(options)

    savedContent.forEach((post) => {
      post.isUpvoted = user.upvotedPosts.some(item => item.postId.toString() === post._id.toString())
      post.isDownvoted = user.downvotedPosts.some(item => item.postId.toString() === post._id.toString())
      post.isSaved = user.savedPosts.some(item => item.postId.toString() === post._id.toString())
      post.isHidden = user.hiddenPosts.some(item => item.postId.toString() === post._id.toString())
      post.isJoined = user.communities.includes(post.communityName)
      post.isModerator = user.moderatorInCommunities.includes(post.communityName)
    })

    res.status(200).json(savedContent)
  } catch (error) {
    console.error('Error getting saved content:', error)
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
      localField: '$hiddenPosts.postId',
      searchType: 'Post', // values can be 'All', 'Post', 'Comment'
      savedAt: '$hiddenPosts.savedAt',
      page: page,
      limit: limit
    }

    const result = await user.getPosts(options)

    result.forEach((post) => {
      post.isUpvoted = user.upvotedPosts.some(item => item.postId.toString() === post._id.toString())
      post.isDownvoted = user.downvotedPosts.some(item => item.postId.toString() === post._id.toString())
      post.isSaved = user.savedPosts.some(item => item.postId.toString() === post._id.toString())
      post.isHidden = user.hiddenPosts.some(item => item.postId.toString() === post._id.toString())
      post.isJoined = user.communities.includes(post.communityName)
      post.isModerator = user.moderatorInCommunities.includes(post.communityName)
    })

    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({ message: 'Error getting hidden posts' })
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
    default:
      return { createdAt: -1, _id: -1 }
  }
}

const getPosts = async (req, res) => {
  try {
    const decoded = req.decoded
    let visitor = null

    if (decoded) {
      visitor = await UserModel.findOne({ username: decoded.username })
      if (!visitor) {
        return res.status(404).json({ message: 'Visitor not found' })
      }
    }

    const username = req.params.username
    if (!username) {
      throw new Error('Username is required')
    }

    const user = await UserModel.findOne({ username: username })
    if (!user || user.isDeleted) {
      return res.status(404).json({ message: 'User not found' })
    }

    const page = req.query.page ? parseInt(req.query.page) : 1
    const limit = req.query.limit ? parseInt(req.query.limit) : 10
    const sort = req.query.sort
    const time = filterWithTime(req.query.sort === 'top' ? req.query.time || 'all' : 'all')

    const posts = await user.getUserPosts({
      username: username,
      page: page,
      limit: limit,
      sort: sort,
      time: time,
      mutedCommunities: !visitor || visitor.username === username ? [] : visitor.mutedCommunities,
      showAdultContent: !visitor ? false : visitor.preferences.showAdultContent
    })

    posts.forEach((post) => {
      if (post.type !== 'Poll') {
        delete post.pollOptions
        delete post.expirationDate
      } else {
        post.pollOptions.forEach((option) => {
          option.votes = option.voters.length
          option.isVoted = visitor ? option.voters.includes(visitor) : false
          delete option.voters
          delete option._id
        })
      }

      post.isUpvoted = visitor ? visitor.upvotedPosts.some(item => item.postId.toString() === post._id.toString()) : false
      post.isDownvoted = visitor ? visitor.downvotedPosts.some(item => item.postId.toString() === post._id.toString()) : false
      post.isSaved = visitor ? visitor.savedPosts.some(item => item.postId.toString() === post._id.toString()) : false
      post.isHidden = visitor ? visitor.hiddenPosts.some(item => item.postId.toString() === post._id.toString()) : false
      post.isJoined = visitor ? visitor.communities.includes(post.communityName) : false
      post.isModerator = visitor ? visitor.moderatorInCommunities.includes(post.communityName) : false
    })

    res.status(200).json(posts)
  } catch (error) {
    res.status(400).json({ message: 'Error getting user posts: ' + error.message })
  }
}

const getComments = async (req, res) => {
  try {
    const decoded = req.decoded
    let visitor = null

    if (decoded) {
      visitor = await UserModel.findOne({ username: decoded.username })
      if (!visitor) {
        return res.status(404).json({ message: 'Visitor not found' })
      }
    }

    const username = req.params.username
    if (!username) {
      throw new Error('Username is required')
    }

    const user = await UserModel.findOne({ username: username })
    if (!user || user.isDeleted) {
      return res.status(404).json({ message: 'User not found' })
    }

    const page = req.query.page ? parseInt(req.query.page) : 1
    const limit = req.query.limit ? parseInt(req.query.limit) : 10
    const sort = req.query.sort
    const time = filterWithTime(req.query.sort === 'top' ? req.query.time || 'all' : 'all')

    const comments = await user.getUserComments({
      username: username,
      page: page,
      limit: limit,
      sort: sort,
      time: time,
      mutedCommunities: !visitor || visitor.username === username ? [] : visitor.mutedCommunities,
      showAdultContent: !visitor ? false : visitor.preferences.showAdultContent
    })

    comments.forEach((post) => {
      post.isUpvoted = visitor ? visitor.upvotedPosts.some(item => item.postId.toString() === post._id.toString()) : false
      post.isDownvoted = visitor ? visitor.downvotedPosts.some(item => item.postId.toString() === post._id.toString()) : false
      post.isSaved = visitor ? visitor.savedPosts.some(item => item.postId.toString() === post._id.toString()) : false
      post.isJoined = visitor ? visitor.communities.includes(post.communityName) : false
      post.isModerator = visitor ? visitor.moderatorInCommunities.includes(post.communityName) : false
    })

    res.status(200).json(comments)
  } catch (error) {
    res.status(400).json({ message: 'Error getting user comments: ' + error.message })
  }
}

const getUpvotedPosts = async (req, res) => {
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
      unwind: '$upvotedPosts',
      localField: '$upvotedPosts.postId',
      searchType: 'Post',
      savedAt: '$upvotedPosts.savedAt',
      page: page,
      limit: limit
    }

    const result = await user.getPosts(options)

    result.forEach((post) => {
      post.isUpvoted = user.upvotedPosts.some(item => item.postId.toString() === post._id.toString())
      post.isDownvoted = user.downvotedPosts.some(item => item.postId.toString() === post._id.toString())
      post.isSaved = user.savedPosts.some(item => item.postId.toString() === post._id.toString())
      post.isHidden = user.hiddenPosts.some(item => item.postId.toString() === post._id.toString())
      post.isJoined = user.communities.includes(post.communityName)
      post.isModerator = user.moderatorInCommunities.includes(post.communityName)
    })

    res.status(200).json(result)
  } catch (error) {
    console.log(error)
    res.status(400).json({ message: 'Error getting upvoted posts' })
  }
}

const getDownvotedPosts = async (req, res) => {
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
    const sort = getSortingMethod(req.query.sort)

    const options = {
      username: username,
      unwind: '$downvotedPosts',
      localField: '$downvotedPosts.postId',
      savedAt: '$downvotedPosts.savedAt',
      page: page,
      limit: limit,
      sort: sort,
      searchType: 'Post'
    }

    const result = await user.getPosts(options)

    result.forEach((post) => {
      post.isUpvoted = user.upvotedPosts.some(item => item.postId.toString() === post._id.toString())
      post.isDownvoted = user.downvotedPosts.some(item => item.postId.toString() === post._id.toString())
      post.isSaved = user.savedPosts.some(item => item.postId.toString() === post._id.toString())
      post.isHidden = user.hiddenPosts.some(item => item.postId.toString() === post._id.toString())
      post.isJoined = user.communities.includes(post.communityName)
      post.isModerator = user.moderatorInCommunities.includes(post.communityName)
    })

    res.status(200).json(result)
  } catch (error) {
    res.status(400).json({ message: 'Error getting downvoted posts' })
  }
}

const getHistory = async (req, res) => {
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
      page: page,
      limit: limit
    }

    const result = await HistoryModel.getUserHistory(options)

    result.forEach((post) => {
      post.isUpvoted = user.upvotedPosts.some(item => item.postId.toString() === post._id.toString())
      post.isDownvoted = user.downvotedPosts.some(item => item.postId.toString() === post._id.toString())
      post.isSaved = user.savedPosts.some(item => item.postId.toString() === post._id.toString())
      post.isHidden = user.hiddenPosts.some(item => item.postId.toString() === post._id.toString())
      post.isJoined = user.communities.includes(post.communityName)
      post.isModerator = user.moderatorInCommunities.includes(post.communityName)

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
    })

    res.status(200).json(result)
  } catch (error) {
    res.status(400).json({ message: 'Error getting history: ' + error.message })
  }
}

const clearHistory = async (req, res) => {
  try {
    const username = req.decoded.username
    if (!username) {
      throw new Error('Username is required')
    }
    const user = await UserModel.findOne({ username: username, isDeleted: false })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    await HistoryModel.deleteMany({ owner: username })

    res.status(200).json({ message: 'History cleared successfully' })
  } catch (error) {
    res.status(400).json({ message: 'Error clearing history: ' + error.message })
  }
}

const getJoinedCommunities = async (req, res) => {
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
      page: page,
      limit: limit
    }

    const communities = await user.getJoinedCommunities(options)

    res.status(200).json(communities)
  } catch (error) {
    res.status(400).json({ message: 'Error getting joined communities: ' + error.message })
  }
}

const getUserOverview = async (req, res) => {
  try {
    const decoded = req.decoded
    let visitor = null
    if (decoded) {
      visitor = await UserModel.findOne({ username: decoded.username, isDeleted: false })
      if (!visitor) {
        return res.status(404).json({ message: 'Visitor not found' })
      }
    }

    const username = req.params.username
    if (!username) {
      throw new Error('Username is required')
    }

    const user = await UserModel.findOne({ username, isDeleted: false })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const page = req.query.page ? parseInt(req.query.page) - 1 : 0
    const limit = req.query.limit ? parseInt(req.query.limit) : 10
    const sort = req.query.sort || 'new'
    let time = (req.query.time === 'top' && req.query.time) || 'all'
    time = filterWithTime(time)
    const sortMethod = getSortingMethod(sort)

    const options = {
      username: username,
      page: page,
      limit: limit,
      sort: sortMethod,
      time: time,
      mutedCommunities: !visitor || visitor.username === username ? [] : visitor.mutedCommunities,
      showAdultContent: !visitor ? false : visitor.preferences.showAdultContent,
      communities: !visitor ? [] : visitor.communities
    }

    const posts = await PostModel.getUserOverview(options)

    posts.forEach((post) => {
      if (post.type !== 'Poll') {
        delete post.pollOptions
        delete post.expirationDate
      } else {
        post.pollOptions.forEach((option) => {
          option.votes = option.voters.length
          option.isVoted = visitor ? option.voters.includes(visitor) : false
          delete option.voters
          delete option._id
        })
      }

      post.isUpvoted = visitor ? visitor.upvotedPosts.some(item => item.postId.toString() === post._id.toString()) : false
      post.isDownvoted = visitor ? visitor.downvotedPosts.some(item => item.postId.toString() === post._id.toString()) : false
      post.isSaved = visitor ? visitor.savedPosts.some(item => item.postId.toString() === post._id.toString()) : false
      post.isHidden = visitor ? visitor.hiddenPosts.some(item => item.postId.toString() === post._id.toString()) : false
      post.isJoined = visitor ? visitor.communities.includes(post.communityName) : false
      post.isModerator = visitor ? visitor.moderatorInCommunities.includes(post.communityName) : false
      post.isBlocked = visitor ? visitor.blockedUsers.includes(post.username) : false
    })

    res.status(200).json(posts)
  } catch (error) {
    res.status(400).json({ message: 'Error getting user overview: ' + error.message })
  }
}

const getModeratorIn = async (req, res) => {
  try {
    const username = req.decoded.username

    const user = await UserModel.findOne({ username: username, isDeleted: false })
    const communities = user.moderatorInCommunities

    const moderatorIn = []
    for (let i = 0; i < communities.length; i++) {
      const community = await CommunityModel.findOne({ name: communities[i] })
      moderatorIn.push({
        name: community.name,
        icon: community.icon,
        members: community.members
      })
    }

    res.status(200).json(moderatorIn)
  } catch (error) {
    res.status(500).json({ message: 'Error getting communities where the user is moderator' })
  }
}

module.exports = {
  getUser,
  follow,
  unfollow,
  block,
  unblock,
  isUsernameAvailable,
  generateUsername,
  forgotPassword,
  resetPassword,
  forgotUsername,
  changePassword,
  changeEmail,
  getUserView,
  getSettings,
  updateSettings,
  getSaved,
  getHiddenPosts,
  getPosts,
  getComments,
  getUpvotedPosts,
  getDownvotedPosts,
  getHistory,
  clearHistory,
  getJoinedCommunities,
  getUserOverview,
  getModeratorIn
}
