const { faker } = require('@faker-js/faker')
const NotificationModel = require('../models/Notification')
const { usernames, postIDs, commentIDs } = require('./SeedUtils')
const { NOTIFICATIONS } = require('./SeedConfig')

const notifications = []

function createRandomPostNotifications () {
  const types = ['message', 'chatMessage', 'chatRequest', 'mention', 'comment', 'upvotedPost', 'upvotedComment', 'repliesComment', 'follow', 'cakeDay', 'followedPost']
  for (let i = 0; i < NOTIFICATIONS / 2; i++) {
    const type = faker.helpers.arrayElement(types)
    let content = faker.lorem.paragraph()
    if (type === 'mention') {
      content += ` u/${faker.helpers.arrayElement(usernames)}`
    }
    notifications.push({
      user: faker.helpers.arrayElement(usernames),
      notificationFrom: faker.helpers.arrayElement(usernames),
      type: faker.helpers.arrayElement(types),
      resourceId: faker.helpers.arrayElement(postIDs),
      title: faker.lorem.sentence(),
      content: content,
      isRead: faker.datatype.boolean(0.1)
    })
  }
}

async function seedNotifications () {
  createRandomPostNotifications()
  await NotificationModel.deleteMany({})
  await NotificationModel.insertMany(notifications)
  console.log('Notifications seeded')
}

module.exports = seedNotifications
