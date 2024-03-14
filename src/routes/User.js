const { Router } = require('express')
const { createUser, deleteUser, login, logout, verifyUser } = require('../controllers/Auth')
const verifyToken = require('../middlewares/Verify')

const userRouter = Router()

userRouter.post('/', createUser)
userRouter.delete('/', verifyToken, deleteUser)
userRouter.post('/login', login)
userRouter.get('/logout', verifyToken, logout)
userRouter.get('/verify/:token', verifyUser)

module.exports = userRouter
