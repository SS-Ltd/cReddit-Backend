const UserModel = require('../src/models/User')
const { forgetPassword } = require('../src/controllers/User')
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
