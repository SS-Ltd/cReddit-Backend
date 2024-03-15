const nodemailer = require('nodemailer')
const jwt = require('jsonwebtoken')

const SendVerificationEmail = async (email, username) => {
  const verificationToken = jwt.sign({ email, username }, process.env.VERIFICATION_TOKEN_SECRET, { expiresIn: '1d' })
  const subject = 'Email Verification'
  const body = `Hello ${username},\n\nPlease verify your email by clicking on the link below\n\n${process.env.BASE_URL}/verify-email?token=${verificationToken}`
  await SendEmail(email, subject, body)
}

const SendEmail = (email, subject, body) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'eplmanagement03@gmail.com',
      pass: 'fnlfcqvgxtzbgwey'
    },
    tls: {
      rejectUnauthorized: false
    }
  })

  const mailConfigurations = {
    from: 'eplmanagement03@gmail.com',
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

module.exports = SendVerificationEmail
