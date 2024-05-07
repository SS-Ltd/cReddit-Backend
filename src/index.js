const express = require('express')
const connectDB = require('./models/mongoose')
const cookies = require('cookie-parser')
const userRouter = require('./routes/User')
const postRouter = require('./routes/Post')
const communityRouter = require('./routes/Community')
const commentRouter = require('./routes/Comment')
const searchRouter = require('./routes/Search')
const modRouter = require('./routes/Moderation')
const messageRouter = require('./routes/Message')
const notificationRouter = require('./routes/Notification')
const chatRouter = require('./routes/Chat')
const dotenv = require('dotenv')
const cors = require('cors')
const SearchUtils = require('./utils/Search')
const { authenticate } = require('./middlewares/Verify')
const http = require('http')
const { Server } = require('socket.io')
const { connectSocket } = require('./utils/Socket')
const swStats = require('swagger-stats')

dotenv.config()

connectDB()

const app = express()

app.use(swStats.getMiddleware({}))
app.use(express.json())
app.use(cors({ credentials: true, origin: process.env.BASE_URL }))
app.use(cookies())

const server = http.createServer(app)
console.log('Server created: ', server)
const io = new Server(server, {
  cookie: true,
  pingTimeout: 60000,
  cors: {
    origin: process.env.SOCKET_URL,
    credentials: true
  }
})

io.use((socket, next) => {
  const cookies = socket.request?.headers?.cookie?.split(';')?.find((c) => c.trim().startsWith('accessToken='))?.split('=')
  if (!cookies || cookies.length < 2) {
    return next(new Error('Authentication error'))
  }
  const token = cookies[1]
  if (!token) {
    return next(new Error('Authentication error'))
  }
  console.log('Token: ', token)
  const username = authenticate(token)
  console.log(username)
  if (!username) {
    return next(new Error('Authentication error'))
  }
  socket.decoded = username
  next()
})

app.set('io', io)
connectSocket(io)

const port = process.env.PORT

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookies())
app.use('/user', userRouter)
app.use('/post', postRouter)
app.use('/subreddit', communityRouter)
app.use('/post', postRouter)
app.use('/comment', commentRouter)
app.use('/notification', notificationRouter)
app.use('/search', searchRouter)
app.use('/mod', modRouter)
app.use('/message', messageRouter)
app.use('/chat', chatRouter)

SearchUtils.upsertSearchIndex('communitySearchIndex', 'communities')
SearchUtils.upsertSearchIndex('postSearchIndex', 'posts')
SearchUtils.upsertSearchIndex('userSearchIndex', 'users')

app.get('/', (req, res) => {
  res.send('Hello World!')
})

server.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
