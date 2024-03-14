const express = require('express')
const connectDB = require('./models/Mongoose')
const dotenv = require('dotenv')
const userRoutes = require('./routes/User')
const cors = require('cors')
const cookies = require('cookie-parser')

dotenv.config()

connectDB()

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())
app.use(cookies())

const port = process.env.PORT || 3000

app.use('/user', userRoutes)

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
