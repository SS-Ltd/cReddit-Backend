const nodemailer = require('nodemailer')
require('dotenv').config({ path: '../../.env' })

const sendEmail = async (options) => {
  // please note that we will be use a services like gmail however for testing purposes we will use mailtrap
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
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

module.exports = sendEmail
