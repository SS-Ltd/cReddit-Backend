const { Router } = require('express')
const { createUser } = require('../controllers/Auth')

const userRouter = Router()

userRouter.post('/', createUser)

module.exports = userRouter
