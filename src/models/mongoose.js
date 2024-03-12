const mongoose = require('mongoose')
require('dotenv').config({ path: '../../.env' })

const dbURL = process.env.MONGO_DB || process.env.DB_URL
const connectDB = async () => {
  try {
    await mongoose.connect(dbURL)
    console.log('Connected to database')
  } catch (error) {
    console.error('Error connecting to database: ', error)
  }
}

module.exports = connectDB
