const { Router } = require('express')
const { createUser, deleteUser, login, logout } = require('../controllers/Auth')
const verifyToken = require('../middlewares/Verify')

const userRouter = Router()

userRouter.post('/', createUser)
userRouter.delete('/', verifyToken, deleteUser)
userRouter.post('/login', login)
userRouter.get('/logout', verifyToken, logout)

module.exports = userRouter
