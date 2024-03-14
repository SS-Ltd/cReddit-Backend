const mongoose = require('mongoose')
require('dotenv').config({ path: '../../.env' })

const connectDB = async () => {
  const dbURL = process.env.MONGO_DB
  try {
    await mongoose.connect(dbURL)
    console.log('Connected to database')
  } catch (error) {
    console.error('Error connecting to database: ', error)
  }
}

module.exports = connectDB
