const { faker } = require('@faker-js/faker')
const CommentModel = require('../models/Comment')
const { usernames, postIDs, communityIDs, commentIDs } = require('./SeedUtils')

const comments = []

function createRandomComments () {
  for (let i = 0; i < commentIDs.length; i++) {
    comments.push({
      _id: commentIDs[i],
      postID: faker.helpers.arrayElement(postIDs),
      username: faker.helpers.arrayElement(usernames),
      parentID: faker.helpers.arrayElement([...commentIDs.slice(0, i - 1), null]),
      communityID: faker.helpers.arrayElement(communityIDs),
      content: faker.lorem.paragraph(),
      upvote: faker.number.int(),
      downvote: faker.number.int(),
      isEdited: faker.datatype.boolean(),
      isLocked: faker.datatype.boolean(),
      isApproved: faker.datatype.boolean(),
      isDeleted: faker.datatype.boolean(0.1)
    })
  }
}

async function seedComments () {
  createRandomComments()
  await CommentModel.deleteMany({})
  await CommentModel.insertMany(comments)
  console.log('Comments seeded')
}

module.exports = seedComments
