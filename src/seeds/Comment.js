const { faker } = require('@faker-js/faker')
const CommentModel = require('../models/Comment')
const { usernames, postIDs, communityIDs, commentIDs } = require('./SeedUtils')

const comments = []

function createRandomComments () {
  for (let i = 0; i < commentIDs.length; i++) {
    const upvotes = faker.number.int({ min: 10000, max: 100000 })
    const downvotes = faker.number.int({ min: 0, max: 50000 })

    comments.push({
      _id: commentIDs[i],
      postID: faker.helpers.arrayElement(postIDs),
      username: faker.helpers.arrayElement(usernames),
      parentID: faker.helpers.arrayElement([...commentIDs.slice(0, i - 1), null]),
      communityID: faker.helpers.arrayElement(communityIDs),
      content: faker.lorem.paragraph(),
      upvote: upvotes,
      downvote: downvotes,
      netVote: upvotes - downvotes,
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
