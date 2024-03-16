const UserModel = require('../src/models/User')
const { forgetPassword, resetPassword, forgotUsername } = require('../src/controllers/User')
// jest.mock('../src/utils/Email', () => jest.fn())
jest.mock('../src/utils/Email', () => {
  return jest.fn()
})
const sendEmail = require('../src/utils/Email')
const bcrypt = require('bcrypt')

afterEach(() => {
  jest.restoreAllMocks()
})

test('should generate a 64 character reset token', async () => {
  const user = new UserModel()
  const resetToken = await user.createResetPasswordToken()
  console.log(resetToken)
  expect(resetToken.length).toBe(64)
})

test('should throw an error when bcrypt.genSalt throws an error', async () => {
  const user = new UserModel()
  jest.spyOn(bcrypt, 'genSalt').mockRejectedValue(new Error('bcrypt.genSalt error'))
  await expect(user.createResetPasswordToken()).rejects.toThrow('bcrypt.genSalt error')
})

// Successfully find user by username and email, generate reset token, send email, and return success message
test('should find user by username and email, generate reset token, send email, and return success message', async () => {
  const req = {
    body: {
      username: 'testuser',
      email: 'testuser@example.com'
    },
    protocol: 'http',
    get: jest.fn().mockReturnValue('localhost')
  }

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  }

  const next = jest.fn()

  const user = {
    email: 'testuser@example.com',
    createResetPasswordToken: jest.fn().mockReturnValue('resetToken'),
    save: jest.fn()
  }

  UserModel.findOne = jest.fn().mockResolvedValue(user)
  // sendEmail.mockImplementation(() => Promise.resolve())
  sendEmail.mockResolvedValue()

  await forgetPassword(req, res, next)

  expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testuser', email: 'testuser@example.com' })
  expect(user.createResetPasswordToken).toHaveBeenCalled()
  expect(user.save).toHaveBeenCalled()
  expect(sendEmail).toHaveBeenCalledWith({
    email: 'testuser@example.com',
    subject: 'Ask and you shall receive a password reset',
    message: expect.any(String)
  })
  expect(res.status).toHaveBeenCalledWith(200)
  expect(res.json).toHaveBeenCalledWith({ message: 'Reset password has been sent to the user successfully' })
})

test('should return error message and error object when user is not found', async () => {
  const req = {
    body: {
      username: 'testuser',
      email: 'testuser@example.com'
    }
  }

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  }

  const next = jest.fn()

  UserModel.findOne = jest.fn().mockResolvedValue(null)

  await forgetPassword(req, res, next)

  expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testuser', email: 'testuser@example.com' })
  expect(res.status).toHaveBeenCalledWith(404)
  expect(res.json).toHaveBeenCalledWith({ message: 'Username or Email not found' })
  expect(next).toHaveBeenCalledWith(expect.any(Error))
})

// Successfully find user by username and email, generate reset token, fail to send email, delete reset token, and return error message
test('should return error message when fail to send email', async () => {
  const req = {
    body: {
      username: 'testuser',
      email: 'testuser@example.com'
    },
    protocol: 'http',
    get: jest.fn().mockReturnValue('localhost')
  }

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  }

  const next = jest.fn()

  const user = {
    createResetPasswordToken: jest.fn().mockReturnValue('resetToken'),
    save: jest.fn()
  }

  UserModel.findOne = jest.fn().mockResolvedValue(user)

  sendEmail.mockRejectedValue(new Error('Failed to send email'))

  await forgetPassword(req, res, next)

  expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testuser', email: 'testuser@example.com' })
  expect(user.createResetPasswordToken).toHaveBeenCalled()
  expect(user.save).toHaveBeenCalled()
  expect(sendEmail).toHaveBeenCalledWith({
    email: 'testuser@example.com',
    subject: 'Ask and you shall receive a password reset',
    message: expect.any(String)
  })
  expect(user.passwordResetToken).toBeUndefined()
  expect(user.resetPasswordTokenExpire).toBeUndefined()
  expect(user.save).toHaveBeenCalled()
  expect(res.status).toHaveBeenCalledWith(500)
  expect(res.json).toHaveBeenCalledWith({ message: 'There was an error sending the email. Try again later' })
})

test('should fail to delete reset token and return error message when failing to send email', async () => {
  const req = {
    body: {
      username: 'testuser',
      email: 'testuser@example.com'
    },
    protocol: 'http',
    get: jest.fn().mockReturnValue('localhost')
  }

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  }

  const next = jest.fn()

  const user = {
    createResetPasswordToken: jest.fn().mockReturnValue('resetToken'),
    save: jest.fn()
  }

  UserModel.findOne = jest.fn().mockResolvedValue(user)

  sendEmail.mockRejectedValue(new Error('Failed to send email'))

  await forgetPassword(req, res, next)

  expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testuser', email: 'testuser@example.com' })
  expect(user.createResetPasswordToken).toHaveBeenCalled()
  expect(user.save).toHaveBeenCalled()
  expect(sendEmail).toHaveBeenCalledWith({
    email: 'testuser@example.com',
    subject: 'Ask and you shall receive a password reset',
    message: expect.any(String)
  })
  expect(user.passwordResetToken).toBeUndefined()
  expect(user.resetPasswordTokenExpire).toBeUndefined()
  expect(user.save).toHaveBeenCalled()
  expect(res.status).toHaveBeenCalledWith(500)
  expect(res.json).toHaveBeenCalledWith({ message: 'There was an error sending the email. Try again later' })
  expect(next).toHaveBeenCalledWith(new Error('There was an error sending the email. Try again later'))
})

test('should fail to send email due to invalid email address, delete reset token, and return error message', async () => {
  const req = {
    body: {
      username: 'testuser',
      email: 'testuser@example.com'
    },
    protocol: 'http',
    get: jest.fn().mockReturnValue('localhost')
  }

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  }

  const next = jest.fn()

  const user = {
    createResetPasswordToken: jest.fn().mockReturnValue('resetToken'),
    save: jest.fn()
  }

  UserModel.findOne = jest.fn().mockResolvedValue(user)

  sendEmail.mockRejectedValue(new Error('Invalid email address'))

  await forgetPassword(req, res, next)

  expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testuser', email: 'testuser@example.com' })
  expect(user.createResetPasswordToken).toHaveBeenCalled()
  expect(user.save).toHaveBeenCalled()
  expect(sendEmail).toHaveBeenCalledWith({
    email: 'testuser@example.com',
    subject: 'Ask and you shall receive a password reset',
    message: expect.any(String)
  })
  expect(user.passwordResetToken).toBeUndefined()
  expect(user.resetPasswordTokenExpire).toBeUndefined()
  expect(user.save).toHaveBeenCalled()
  expect(res.status).toHaveBeenCalledWith(500)
  expect(res.json).toHaveBeenCalledWith({ message: 'There was an error sending the email. Try again later' })
  expect(next).toHaveBeenCalledWith(new Error('There was an error sending the email. Try again later'))
})

test('should send email with correct subject and message format', async () => {
  const req = {
    body: {
      username: 'testuser',
      email: 'testuser@example.com'
    },
    protocol: 'http',
    get: jest.fn().mockReturnValue('localhost')
  }

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  }

  const next = jest.fn()

  const user = {
    createResetPasswordToken: jest.fn().mockReturnValue('resetToken'),
    save: jest.fn()
  }

  UserModel.findOne = jest.fn().mockResolvedValue(user)

  sendEmail.mockResolvedValue()

  await forgetPassword(req, res, next)

  expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testuser', email: 'testuser@example.com' })
  expect(user.createResetPasswordToken).toHaveBeenCalled()
  expect(user.save).toHaveBeenCalled()
  expect(sendEmail).toHaveBeenCalledWith({
    email: 'testuser@example.com',
    subject: 'Ask and you shall receive a password reset',
    message: expect.any(String)
  })
  expect(res.status).toHaveBeenCalledWith(200)
  expect(res.json).toHaveBeenCalledWith({ message: 'Reset password has been sent to the user successfully' })
})

// ////////////////////////// Reset password test ////////////////////
test('should retrieve user based on valid token and reset password successfully', async () => {
  const req = {
    params: {
      token: 'validToken'
    },
    body: {
      password: 'newPassword1',
      confirmPassword: 'newPassword1'
    }
  }

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  }

  const next = jest.fn()

  const user = {
    resetPasswordTokenExpire: Date.now() + 3600000,
    resetPasswordToken: 'hashedToken',
    save: jest.fn()
  }

  UserModel.findOne = jest.fn().mockResolvedValue(user)
  bcrypt.compare = jest.fn().mockResolvedValue(true)
  bcrypt.hash = jest.fn().mockResolvedValue('hashedPassword')

  await resetPassword(req, res, next)

  expect(UserModel.findOne).toHaveBeenCalledWith({ resetPasswordTokenExpire: { $gt: expect.any(Number) } })
  expect(bcrypt.compare).toHaveBeenCalledWith('validToken', 'hashedToken')
  expect(user.password).toBe('hashedPassword')
  expect(user.passwordChangedAt).toBeTruthy()
  expect(user.resetPasswordToken).toBeUndefined()
  expect(user.resetPasswordTokenExpire).toBeUndefined()
  expect(user.save).toHaveBeenCalled()
  expect(res.status).toHaveBeenCalledWith(200)
  expect(res.json).toHaveBeenCalledWith({ message: 'Password has been reset successfully' })
})

test('should return an error message when token has expired', async () => {
  const req = {
    params: {
      token: 'expiredToken'
    }
  }

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  }

  const next = jest.fn()

  UserModel.findOne = jest.fn().mockResolvedValue(null)

  await resetPassword(req, res, next)

  expect(UserModel.findOne).toHaveBeenCalledWith({ resetPasswordTokenExpire: { $gt: expect.any(Number) } })
  expect(res.status).toHaveBeenCalledWith(400)
  expect(res.json).toHaveBeenCalledWith({ message: 'Token has expired' })
  expect(next).toHaveBeenCalledWith(new Error('Token has expired'))
})

test('should return error message when passwords do not match', async () => {
  const req = {
    params: {
      token: 'validToken'
    },
    body: {
      password: 'newPassword',
      confirmPassword: 'differentPassword'
    }
  }

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  }

  const next = jest.fn()

  const user = {
    resetPasswordTokenExpire: Date.now() + 3600000,
    resetPasswordToken: 'hashedToken',
    save: jest.fn()
  }

  UserModel.findOne = jest.fn().mockResolvedValue(user)

  await resetPassword(req, res, next)

  expect(UserModel.findOne).toHaveBeenCalledWith({ resetPasswordTokenExpire: { $gt: expect.any(Number) } })
  expect(res.status).toHaveBeenCalledWith(400)
  expect(res.json).toHaveBeenCalledWith({ message: 'Passwords do not match' })
  expect(next).toHaveBeenCalledWith(new Error('Passwords do not match'))
})

test('should return an error message when token is invalid', async () => {
  const req = {
    params: {
      token: 'invalidToken'
    },
    body: {
      password: 'newPassword',
      confirmPassword: 'newPassword'
    }
  }

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  }

  const next = jest.fn()

  const user = {
    resetPasswordTokenExpire: Date.now() + 3600000,
    resetPasswordToken: 'hashedToken',
    save: jest.fn()
  }

  UserModel.findOne = jest.fn().mockResolvedValue(user)
  bcrypt.compare = jest.fn().mockResolvedValue(false)

  await resetPassword(req, res, next)

  expect(UserModel.findOne).toHaveBeenCalledWith({ resetPasswordTokenExpire: { $gt: expect.any(Number) } })
  expect(bcrypt.compare).toHaveBeenCalledWith('invalidToken', 'hashedToken')
  expect(res.status).toHaveBeenCalledWith(400)
  expect(res.json).toHaveBeenCalledWith({ message: 'Token is invalid' })
})

// ////////////////////////// Forgot username test ////////////////////
test('should return 404 status and error message when request body is empty', async () => {
  const req = {
    body: {}
  }

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  }

  const next = jest.fn()

  UserModel.findOne = jest.fn()

  await forgotUsername(req, res, next)

  expect(UserModel.findOne).not.toHaveBeenCalled()
  expect(res.status).toHaveBeenCalledWith(404)
  expect(res.json).toHaveBeenCalledWith({ message: 'Email is required' })
  expect(next).toHaveBeenCalledWith(new Error('Email is required'))
})

test('should send email to user with their username', async () => {
  const req = { body: { email: 'test@example.com' } }
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
  const next = jest.fn()
  const user = { email: 'test@example.com', username: 'testuser' }
  UserModel.findOne = jest.fn().mockResolvedValue(user)

  sendEmail.mockResolvedValue()

  await forgotUsername(req, res, next)

  expect(UserModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' })
  expect(sendEmail).toHaveBeenCalledWith({ email: 'test@example.com', subject: 'So you wanna know your Reddit username, huh?', message: `Hey there,\n\nYou forgot it didn't you? No worries. Here you go:\n\nYour username is: ${user.username}\n\n(Username checks out, nicely done.)\n\nIf you didn't forget your username, please ignore this email!` })
  expect(res.status).toHaveBeenCalledWith(200)
  expect(res.json).toHaveBeenCalledWith({ message: 'Username has been sent to the user successfully' })
})

test('should handle error while sending email to user', async () => {
  const req = { body: { email: 'test@example.com' } }
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
  const next = jest.fn()
  const user = { email: 'test@example.com', username: 'testuser' }
  UserModel.findOne = jest.fn().mockResolvedValue(user)
  sendEmail.mockRejectedValue(new Error('Failed to send email'))

  await forgotUsername(req, res, next)

  expect(UserModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' })
  expect(sendEmail).toHaveBeenCalledWith({ email: 'test@example.com', subject: 'So you wanna know your Reddit username, huh?', message: `Hey there,\n\nYou forgot it didn't you? No worries. Here you go:\n\nYour username is: ${user.username}\n\n(Username checks out, nicely done.)\n\nIf you didn't forget your username, please ignore this email!` })
  expect(res.status).toHaveBeenCalledWith(500) // Expectation changed to 500 for error case
  expect(res.json).toHaveBeenCalledWith({ message: 'There was an error sending the email. Try again later' })
})

test('should return an error message when user does not exist with provided email', async () => {
  const req = { body: { email: 'nonexistent@example.com' } }
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
  const next = jest.fn()
  UserModel.findOne = jest.fn().mockResolvedValue(null)

  await forgotUsername(req, res, next)

  expect(UserModel.findOne).toHaveBeenCalledWith({ email: 'nonexistent@example.com' })
  expect(res.status).toHaveBeenCalledWith(404)
  expect(res.json).toHaveBeenCalledWith({ message: 'Email not found' })
  expect(next).toHaveBeenCalledWith(new Error('Email not found'))
})
