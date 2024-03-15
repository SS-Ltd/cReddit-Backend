const { Router } = require('express')
const { createUser, deleteUser, login, logout, verifyUser } = require('../controllers/Auth')
const verifyToken = require('../middlewares/Verify')
const { refreshToken } = require('../controllers/JWT')

const userRouter = Router()

userRouter.post('/', createUser)
userRouter.delete('/', verifyToken, deleteUser)
userRouter.post('/login', login)
userRouter.get('/logout', verifyToken, logout)
userRouter.get('/verify/:token', verifyUser)
userRouter.get('/refreshToken', refreshToken)

module.exports = userRouter
