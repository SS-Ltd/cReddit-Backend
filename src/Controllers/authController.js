const User = require('../models/User')
const sendEmail = require('../Utils/email')

exports.forgetPassword = async (req, res, next) => {
  // 1) Check if the user exists with the username and email provided
  const user = await User.findOne({ username: req.body.username, email: req.body.email })

  if (!user) {
    res.status(404).json({ message: 'Username or Email not found' })
    return next(new Error('Username or Email not found'))
  }
  console.log('after')
  // 2) Generate reset token
  const resetToken = await user.createResetPasswordToken()
  console.log('resetToken in controller: ', resetToken)
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
    console.error('Error sending the email: ', error)
    res.status(500).json({ message: 'There was an error sending the email. Try again later' })
    return next(new Error('There was an error sending the email. Try again later'))
  }
}
