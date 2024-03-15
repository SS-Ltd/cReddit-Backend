const { faker } = require('@faker-js/faker')
const MessageModel = require('../models/Message')
const { usernames, messageIDs } = require('./SeedUtils')

const messages = []

function createRandomMessages () {
  for (let i = 0; i < messageIDs.length; i++) {
    const sender = usernames[Math.floor(Math.random() * usernames.length)]
    let receiver = usernames[Math.floor(Math.random() * usernames.length)]
    while (sender === receiver) {
      receiver = usernames[Math.floor(Math.random() * usernames.length)]
    }
    messages.push({
      id: messageIDs[i],
      from: sender,
      to: receiver,
      subject: faker.lorem.sentence(),
      text: faker.lorem.paragraphs(),
      isRead: faker.datatype.boolean(0.5),
      isDeleted: faker.datatype.boolean(0.1)
    })
  }
}

async function seedMessages () {
  createRandomMessages()
  await MessageModel.deleteMany({})
  await MessageModel.insertMany(messages)
  console.log('Messages seeded')
}

module.exports = seedMessages
