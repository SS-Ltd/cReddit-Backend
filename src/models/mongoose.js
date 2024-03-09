const mongoose = require('mongoose')

const dbURL = 'mongodb+srv://mahmoudsamy1452eg:2QtrZpX8kAZ03tYK@creddit.bgtkbtn.mongodb.net/cReddit?retryWrites=true&w=majority&appName=cReddit'//|| process.env.DB_URL || 'mongodb://localhost:27017/cReddit'
const connectDB = async () => {
  try {
    await mongoose.connect(dbURL)
    console.log('Connected to database')
  } catch (error) {
    console.error('Error connecting to database: ', error)
  }
}

module.exports = connectDB
