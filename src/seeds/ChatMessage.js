const { faker } = require('@faker-js/faker')
const ChatMessageModel = require('../models/ChatMessage')
const { chatRooms } = require('./SeedUtils')

const messages = []

function createRandomChatMessages () {
  const reactionTypes = ['like', 'dislike', 'laugh', 'cry', 'angry']
  for (let i = 0; i < chatRooms.length; i++) {
    const reactors = []
    for (let j = 0; j < 2; j++) {
      let reactor = faker.helpers.arrayElement(chatRooms[i].members)
      while (reactors.includes(reactor)) {
        reactor = faker.helpers.arrayElement(chatRooms[i].members)
      }
      reactors.push(reactor)
    }
    messages.push({
      user: faker.helpers.arrayElement(chatRooms[i].members),
      room: faker.helpers.arrayElement(chatRooms),
      content: faker.lorem.sentence(),
      isRead: faker.datatype.boolean(),
      reactions: [{
        type: faker.helpers.arrayElement(reactionTypes),
        users: reactors
      }]
    })
  }
}

async function seedChatMessages () {
  createRandomChatMessages()
  await ChatMessageModel.deleteMany({})
  await ChatMessageModel.insertMany(messages)
  console.log('Chat messages seeded')
}

module.exports = seedChatMessages
