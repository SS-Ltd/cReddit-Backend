const express = require('express')
const connectDB = require('./models/mongoose')
const cookies = require('cookie-parser')
const userRouter = require('./routes/User')
const dotenv = require('dotenv')
dotenv.config()

connectDB()

const app = express()

const port = process.env.PORT

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookies())
app.use('/user', userRouter)

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
