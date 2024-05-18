const nodemailer = require('nodemailer')
require('dotenv').config({ path: '../../.env' })
const jwt = require('jsonwebtoken')

const sendVerificationEmail = async (req, email, username) => {
  const verificationToken = jwt.sign({ email, username }, process.env.VERIFICATION_TOKEN_SECRET, { expiresIn: '1d' })
  const subject = 'Email Verification'
  const body = `Hello ${username},\n\nPlease verify your email by clicking on the link below\n\n${req.protocol}://creddit.tech/verify/${verificationToken}`
  await sendEmail(email, subject, body)
}

const sendEmail = (email, subject, body) => {
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

module.exports = {
  sendVerificationEmail,
  sendEmail
}
