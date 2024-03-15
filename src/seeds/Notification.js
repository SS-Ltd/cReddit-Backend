const { faker } = require('@faker-js/faker')
const NotificationModel = require('../models/Notification')
const { usernames, postIDs, commentIDs } = require('./SeedUtils')
const { NOTIFICATIONS } = require('./SeedConfig')

const notifications = []

function createRandomPostNotifications () {
  const types = ['comment', 'upvotedPost']
  for (let i = 0; i < NOTIFICATIONS / 2; i++) {
    notifications.push({
      user: faker.helpers.arrayElement(usernames),
      type: faker.helpers.arrayElement(types),
      resourceId: faker.helpers.arrayElement(postIDs),
      isRead: faker.datatype.boolean(0.1)
    })
  }
}

function createRandomCommentNotifications () {
  const types = ['mention', 'upvotedComent', 'repliesComment']
  for (let i = NOTIFICATIONS / 2; i < NOTIFICATIONS; i++) {
    notifications.push({
      user: faker.helpers.arrayElement(usernames),
      type: faker.helpers.arrayElement(types),
      resourceId: faker.helpers.arrayElement(commentIDs),
      isRead: faker.datatype.boolean(0.1)
    })
  }
}

async function seedNotifications () {
  createRandomPostNotifications()
  createRandomCommentNotifications()
  await NotificationModel.deleteMany({})
  await NotificationModel.insertMany(notifications)
  console.log('Notifications seeded')
}

module.exports = seedNotifications
