const UserModel = require('../models/User')
const sendEmail = require('../utils/Email')
const bcrypt = require('bcrypt')
const emailValidator = require('deep-email-validator')

exports.forgetPassword = async (req, res) => {
  // 1) Check if the user exists with the username and email provided
  if (!req.body.username || !req.body.email) {
    return res.status(400).json({ message: 'Username and Email are required' })
  }
  const user = await UserModel.findOne({ username: req.body.username, email: req.body.email, isDeleted: false })

  if (!user) {
    return res.status(404).json({ message: 'Username or Email not found' })
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
    return res.status(500).json({ message: 'There was an error sending the email. Try again later' })
  }
}

function validatePassword (password) {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\w!@#$%^&*()\-_=+\\|[\]{};:'",.<>/?`~ ])[\w!@#$%^&*()\-_=+\\|[\]{};:'",.<>/?`~ ]{8,}$/
  return passwordRegex.test(password)
}

exports.resetPassword = async (req, res) => {
  // 1) Get user based on the token but keep in mind that the token is stored in the database as a hashed value
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

exports.forgotUsername = async (req, res) => {
  if (!req.body.email) {
    return res.status(404).json({ message: 'Email is required' })
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

exports.changePassword = async (req, res) => {
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
exports.changeEmail = async (req, res) => {
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

    if (!password || !newEmail) {
      return res.status(400).json({ message: 'Password and new email are required' })
    }

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
