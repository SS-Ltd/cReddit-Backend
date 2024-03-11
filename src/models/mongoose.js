const mongoose = require('mongoose')

const dbURL = 'mongodb+srv://u1:AGO5eGlwyPMueGXK@creddit.bgtkbtn.mongodb.net/cReddit?retryWrites=true&w=majority&appName=cReddit'
const connectDB = async () => {
  try {
    await mongoose.connect(dbURL)
    console.log('Connected to database')
  } catch (error) {
    console.error('Error connecting to database: ', error)
  }
}

module.exports = connectDB
