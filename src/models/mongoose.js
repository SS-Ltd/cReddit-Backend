const mongoose = require('mongoose')
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })

const connectDB = async () => {
  const dbURL = process.env.MONGO_DB || process.env.DB_URL
  try {
    await mongoose.connect(dbURL)
    console.log('Connected to database')
  } catch (error) {
    console.error('Error connecting to database: ', error)
  }
}

module.exports = connectDB
