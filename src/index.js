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
const http = require('http')
const { Server } = require('socket.io')
const socketio = require('socket.io')
const { connectSocket } = require('./utils/Socket')



dotenv.config()

connectDB()

const app = express()
app.use(express.json())
app.use(cors({ credentials: true, origin: process.env.BASE_URL }))
app.use(cors())
app.use(cookies())

const server = http.createServer(app)
console.log('Server created: ', server)
const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: 'http://localhost:3001',
    credentials: true,
  },
})
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