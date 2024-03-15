const User = require('../models/User')
const sendEmail = require('../utils/Email')
const bcrypt = require('bcrypt')

exports.forgetPassword = async (req, res, next) => {
  // 1) Check if the user exists with the username and email provided
  const user = await User.findOne({ username: req.body.username, email: req.body.email })

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

exports.resetPassword = async (req, res, next) => {
  // 1) Get user based on the token but keep in mind that the token is stored in the database as a hashed value
  const user = await User.findOne({ resetPasswordTokenExpire: { $gt: Date.now() } })

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

exports.forgotUsername = async (req, res, next) => {
  // 1) Check if the user exists with the email provided
  const user = await User.findOne({ email: req.body.email })

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
