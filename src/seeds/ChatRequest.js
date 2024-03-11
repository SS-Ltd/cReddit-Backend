const { faker } = require('@faker-js/faker')
const ChatRequestModel = require('../models/ChatRequest')
const { usernames, chatRooms } = require('./SeedUtils')

const requests = []

function createRandomChatRequests () {
  // I want to pick a user to be invited to a chat room but also make sure he isn't already a member in it
  for (let i = 0; i < 10; i++) {
    const room = faker.helpers.arrayElement(chatRooms)
    const inviter = faker.helpers.arrayElement(room.members)

    let user = faker.helpers.arrayElement(usernames)
    while (room.members.includes(user)) {
      user = faker.helpers.arrayElement(usernames)
    }

    requests.push({ user, room, inviter })
  }
}

async function seedChatRequests () {
  createRandomChatRequests()
  await ChatRequestModel.deleteMany({})
  await ChatRequestModel.insertMany(requests)
  console.log('Chat requests seeded')
}

module.exports = seedChatRequests
