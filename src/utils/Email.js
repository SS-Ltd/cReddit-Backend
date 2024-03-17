const nodemailer = require('nodemailer')
require('dotenv').config({ path: '../../.env' })
const jwt = require('jsonwebtoken')

const SendVerificationEmail = async (email, username) => {
  const verificationToken = jwt.sign({ email, username }, process.env.VERIFICATION_TOKEN_SECRET, { expiresIn: '1d' })
  const subject = 'Email Verification'
  const body = `Hello ${username},\n\nPlease verify your email by clicking on the link below\n\n${process.env.BASE_URL}/verify-email?token=${verificationToken}`
  await SendEmail(email, subject, body)
}

const SendEmail = (email, subject, body) => {
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_HOST,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  })

  const mailConfigurations = {
    from: 'cReddit support center <support@cReddit.com>',
    to: email,
    subject,
    text: body
  }

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailConfigurations, (error, info) => {
      if (error) {
        console.log('Error occurred while sending email', error)
        reject(error)
      } else {
        console.log('Email sent successfully', info.response)
        resolve(info.response)
      }
    })
  })
}

const sendEmail = async (options) => {
  // please note that we will be use a services like gmail however for testing purposes we will use mailtrap
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_HOST,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  })

  const mailOptions = {
    from: 'cReddit support center <support@cReddit.com>',
    to: options.email,
    subject: options.subject,
    text: options.message
  }

  await transporter.sendMail(mailOptions)
}

module.exports = {
  SendVerificationEmail,
  SendEmail
}
