const { faker } = require('@faker-js/faker')
const { USERS, POSTS, COMMENTS, COMMUNITIES, CHAT_ROOMS, MESSAGES } = require('./SeedConfig')

const usernames = []
const postIDs = []
const communityNames = []
const communityIDs = []
const commentIDs = []
const chatRooms = []
const messageIDs = []

function createRandomEntities () {
  for (let i = 0; i < USERS; i++) {
    let username = faker.internet.userName()
    while (usernames.find(name => name === username)) {
      username = faker.internet.userName()
    }
    usernames.push(username)
  }

  for (let i = 0; i < COMMUNITIES; i++) {
    communityNames.push(faker.internet.userName())
    communityIDs.push(faker.database.mongodbObjectId())
  }

  for (let i = 0; i < POSTS; i++) {
    postIDs.push(faker.database.mongodbObjectId())
  }

  for (let i = 0; i < COMMENTS; i++) {
    commentIDs.push(faker.database.mongodbObjectId())
  }

  for (let i = 0; i < MESSAGES; i++) {
    messageIDs.push(faker.database.mongodbObjectId())
  }

  for (let i = 1; i <= CHAT_ROOMS; i++) {
    const roomUsernames = []
    for (let j = 0; j < 4; j++) {
      let username = faker.helpers.arrayElement(usernames)
      while (roomUsernames.includes(username)) {
        username = faker.helpers.arrayElement(usernames)
      }
      roomUsernames.push(username)
    }
    chatRooms.push({ _id: faker.database.mongodbObjectId(), members: roomUsernames })
  }
}

module.exports = { usernames, postIDs, communityNames, communityIDs, commentIDs, chatRooms, messageIDs, createRandomEntities }
