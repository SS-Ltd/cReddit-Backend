const express = require('express')
const connectDB = require('./models/mongoose')
const dotenv = require('dotenv')
dotenv.config({ path: '../.env' })
const authRoutes = require('./routes/User')

connectDB()

const app = express()
app.use(express.json())

const port = process.env.PORT

app.use('/user', authRoutes)

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
