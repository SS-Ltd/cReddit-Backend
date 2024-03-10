const { faker } = require('@faker-js/faker')
const PostModel = require('../models/Post')
const { postIDs, usernames, communityNames } = require('./SeedUtils')

const posts = []

function createRandomPosts () {
  for (let i = 0; i < postIDs.length; i++) {
    posts.push({
      _id: postIDs[i],
      username: faker.helpers.arrayElement(usernames),
      communityName: faker.helpers.arrayElement(communityNames),
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraph(),
      pollOptions: [],
      expirationDate: null,
      upvote: faker.number.int(),
      downvote: faker.number.int(),
      isSpoiler: faker.datatype.boolean(0.2),
      isNSFW: faker.datatype.boolean(0.2),
      isLocked: faker.datatype.boolean(0.2),
      isDeleted: faker.datatype.boolean(0.05),
      isApproved: faker.datatype.boolean(0.4),
      isEdited: faker.datatype.boolean(0.1),
      followers: []
    })
  }
}

async function seedPosts () {
  createRandomPosts()
  await PostModel.deleteMany({})
  await PostModel.insertMany(posts)
  console.log('Posts seeded')
}

module.exports = seedPosts
