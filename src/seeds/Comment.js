const { faker } = require('@faker-js/faker')
const CommentModel = require('../models/Post')
const { usernames, posts, commentIDs } = require('./SeedUtils')

const comments = []

function createRandomComments () {
  for (let i = 0; i < commentIDs.length; i++) {
    const upvotes = faker.number.int({ min: 10000, max: 100000 })
    const downvotes = faker.number.int({ min: 0, max: 50000 })
    const randomNumber = faker.number.int({ min: 0, max: posts.length - 1 })

    comments.push({
      _id: commentIDs[i],
      username: faker.helpers.arrayElement(usernames),
      content: faker.lorem.paragraph(),
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
      postID: posts[randomNumber].postId,
      communityName: posts[randomNumber].communityId,
      isImage: false,
      type: 'Comment'
    })
  }
}
async function seedComments () {
  createRandomComments()
  await CommentModel.insertMany(comments)
  console.log('Comments seeded')
}

module.exports = seedComments
