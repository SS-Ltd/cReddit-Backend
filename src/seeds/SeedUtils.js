const { faker } = require('@faker-js/faker')
const { USERS, POSTS, COMMENTS, COMMUNITIES } = require('./SeedConfig')

const usernames = []
const postIDs = []
const communityNames = []
const communityIDs = []
const commentIDs = []

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
}

module.exports = { usernames, postIDs, communityNames, communityIDs, commentIDs, createRandomEntities }
