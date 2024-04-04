const { faker } = require('@faker-js/faker')
const PostModel = require('../models/Post')
const { postIDs, usernames, communityNames } = require('./SeedUtils')

const posts = []

function createRandomPosts () {
  for (let i = 0; i < postIDs.length; i++) {
    const upvotes = faker.number.int({ min: 10000, max: 100000 })
    const downvotes = faker.number.int({ min: 0, max: 50000 })

    posts.push({
      _id: postIDs[i],
      username: faker.helpers.arrayElement(usernames),
      communityName: faker.helpers.arrayElement(communityNames),
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraph(),
      pollOptions: [],
      expirationDate: null,
      upvote: upvotes,
      downvote: downvotes,
      netVote: upvotes - downvotes,
      views: faker.number.int(),
      isSpoiler: faker.datatype.boolean(0.2),
      isNSFW: faker.datatype.boolean(0.2),
      isLocked: faker.datatype.boolean(0.2),
      isDeleted: faker.datatype.boolean(0.05),
      isApproved: faker.datatype.boolean(0.4),
      isEdited: faker.datatype.boolean(0.1),
      isRemoved: faker.datatype.boolean(0.05),
      followers: [],
      mostRecentUpvote: faker.date.recent(),
      type: faker.helpers.arrayElement(['Post', 'Images & Video', 'Link', 'Poll'])
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
