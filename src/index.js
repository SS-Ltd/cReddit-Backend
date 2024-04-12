const express = require('express')
const connectDB = require('./models/mongoose')
const cookies = require('cookie-parser')
const userRouter = require('./routes/User')
const postRouter = require('./routes/Post')
const communityRouter = require('./routes/Community')
const commentRouter = require('./routes/Comment')
const dotenv = require('dotenv')
const cors = require('cors')
const SearchUtils = require('./utils/Search')

dotenv.config()

connectDB()

const app = express()
app.use(express.json())
app.use(cors({ credentials: true, origin: process.env.BASE_URL }))
app.use(cors())
app.use(cookies())

const port = process.env.PORT

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookies())
app.use('/user', userRouter)
app.use('/post', postRouter)
app.use('/subreddit', communityRouter)
app.use('/post', postRouter)
app.use('/comment', commentRouter)

SearchUtils.upsertSearchIndex('communitySearchIndex', 'communities')
SearchUtils.upsertSearchIndex('postSearchIndex', 'posts')
SearchUtils.upsertSearchIndex('userSeacrhIndex', 'users')

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
