const { Router } = require('express')
const { createUser, deleteUser } = require('../controllers/Auth')
const verifyToken = require('../middlewares/Verify')

const userRouter = Router()

userRouter.post('/', createUser)
userRouter.delete('/', verifyToken, deleteUser)

module.exports = userRouter
