const connectDB = require('../models/mongoose')
const seedUsers = require('./User')
const seedPosts = require('./Post')

connectDB()

async function seed () {
  await seedUsers()
  await seedPosts()
  process.exit()
}

seed()
