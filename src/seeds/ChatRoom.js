const { faker } = require('@faker-js/faker')
const ChatRoomModel = require('../models/ChatRoom')
const { chatRooms } = require('./SeedUtils')

const rooms = []

function createRandomChatRooms () {
  for (let i = 0; i < Object.keys(chatRooms).length; i++) {
    rooms.push({
      _id: chatRooms[i]._id,
      name: faker.lorem.word(),
      members: chatRooms[i].members,
      host: chatRooms[i].members[0]
    })
  }
}

async function seedChatRooms () {
  createRandomChatRooms()
  await ChatRoomModel.deleteMany({})
  await ChatRoomModel.insertMany(rooms)
  console.log('Chat rooms seeded')
}

module.exports = seedChatRooms
