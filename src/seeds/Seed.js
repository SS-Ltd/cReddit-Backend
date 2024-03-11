const connectDB = require('../models/mongoose')
const { createRandomEntities } = require('./SeedUtils')
const seedUsers = require('./User')
const seedPosts = require('./Post')
const seedCommunities = require('./Community')
const seedComments = require('./Comment')
const seedNotifications = require('./Notification')
const seedHistory = require('./History')
const seedChatRooms = require('./ChatRoom')

connectDB()

async function seed () {
  createRandomEntities()
  await seedUsers()
  await seedCommunities()
  await seedPosts()
  await seedComments()
  await seedNotifications()
  await seedHistory()
  await seedChatRooms()
  process.exit()
}

seed()
