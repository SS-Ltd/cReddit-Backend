const UserModel = require('../models/User')
const sendEmail = require('../utils/Email')
const bcrypt = require('bcrypt')
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
    await sendEmail({
      email: user.email,
      subject: 'Ask and you shall receive a password reset',
      message
    })

    return res.status(200).json({ message: 'Reset password has been sent to the user successfully' })
  } catch (error) {
    user.passwordResetToken = undefined
    user.resetPasswordTokenExpire = undefined
    await user.save()
    return res.status(500).json({ message: 'There was an error sending the email. Try again later' })
  }
}

function validatePassword (password) {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\w!@#$%^&*()\-_=+\\|[\]{};:'",.<>/?`~ ])[\w!@#$%^&*()\-_=+\\|[\]{};:'",.<>/?`~ ]{8,}$/
  return passwordRegex.test(password)
}

const resetPassword = async (req, res) => {
  const { token } = req.params
  if (!token) {
    return res.status(400).json({ message: 'Token, password, and confirm password are required' })
  }

  const user = await UserModel.findOne({ resetPasswordTokenExpire: { $gt: Date.now() }, isDeleted: false })

  if (!user) {
    return res.status(400).json({ message: 'Token has expired' })
  }

  const isTokenValid = await bcrypt.compare(req.params.token, user.resetPasswordToken)
  if (!isTokenValid) {
    return res.status(400).json({ message: 'Token is invalid' })
  }

  const { password, confirmPassword } = req.body

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
    await sendEmail({
      email: user.email,
      subject: 'So you wanna know your Reddit username, huh?',
      message
    })
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
  // const user = await UserModel.findOne({ username: 'Laurine.Jenkins', isDeleted: false })

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

  const salt = await bcrypt.genSalt(10)
  user.password = await bcrypt.hash(newPassword, salt)
  user.passwordChangedAt = Date.now()
  await user.save()

  return res.status(200).json({ message: 'Password has been changed successfully' })
}

function validateEmail (email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
const changeEmail = async (req, res) => {
  if (!req.body.password || !req.body.newEmail) {
    return res.status(400).json({ message: 'Password and new email are required' })
  }

  const user = await UserModel.findOne({ username: req.decoded.username, isDeleted: false })
  // const user = await UserModel.findOne({ username: 'Laurine.Jenkins', isDeleted: false })

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

    // const emailValidation = await emailValidator.validate(newEmail)
    // if (!emailValidation.valid) {
    //   return res.status(400).json({ message: 'Email is invalid' })
    // }

    if (!validateEmail(newEmail)) {
      return res.status(400).json({ message: 'Email is invalid' })
    }

    user.email = newEmail
    await user.save()

    return res.status(200).json({ message: 'Email has been changed successfully' })
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
  changeEmail

}
