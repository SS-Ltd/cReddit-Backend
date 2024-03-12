const express = require('express')
const connectDB = require('./models/Mongoose')
const dotenv = require('dotenv')
dotenv.config({ path: '../.env' })

connectDB()

const app = express()

const port = process.env.PORT

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
