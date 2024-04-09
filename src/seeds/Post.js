const { faker } = require('@faker-js/faker')
const PostModel = require('../models/Post')
const { postIDs, usernames, communityNames } = require('./SeedUtils')

const posts = []

function createRandomPosts () {
  for (let i = 0; i < postIDs.length / 2; i++) {
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
      views: faker.number.int({ min: 0, max: 100000 }),
      isSpoiler: faker.datatype.boolean(0.2),
      isNsfw: faker.datatype.boolean(0.2),
      isLocked: faker.datatype.boolean(0.2),
      isDeleted: faker.datatype.boolean(0.05),
      isApproved: faker.datatype.boolean(0.4),
      isEdited: faker.datatype.boolean(0.1),
      isRemoved: faker.datatype.boolean(0.05),
      followers: faker.helpers.shuffle(usernames).slice(0, 5),
      mostRecentUpvote: faker.date.recent(),
      type: 'Post',
      createdAt: faker.date.recent({ days: 450 })
    })
  }
}

function createRandomImages () {
  for (let i = postIDs.length / 2; i < postIDs.length * 3 / 4; i++) {
    const upvotes = faker.number.int({ min: 10000, max: 100000 })
    const downvotes = faker.number.int({ min: 0, max: 50000 })
    const Images = [
      'https://res.cloudinary.com/dfvgbxwed/video/upload/v1711805795/cReddit/exvhyjzxctf543rgpcii.mp4',
      'https://res.cloudinary.com/dfvgbxwed/video/upload/v1711817782/cReddit/cxcohmaylhmoam1o6fgb.mp4',
      'https://res.cloudinary.com/dfvgbxwed/video/upload/v1711817782/cReddit/lpuqv3dsqdpxrao9knie.mp4',
      'https://res.cloudinary.com/dfvgbxwed/video/upload/v1711817859/cReddit/kiwbhvfcwqbyalxolbw5.mp4',
      'https://res.cloudinary.com/dfvgbxwed/video/upload/v1711818207/cReddit/cifgf1a8wwikpqb5ahxg.mp4',
      'https://res.cloudinary.com/dfvgbxwed/video/upload/v1711831051/cReddit/jeheha6t84u0k4belhsm.mp4',
      'https://res.cloudinary.com/dfvgbxwed/video/upload/v1711831661/cReddit/vrtnnp14r4el9tcap4fz.mp4',
      'https://res.cloudinary.com/dfvgbxwed/video/upload/v1712160280/cReddit/xjlbzyjy0nf5tb1ykgm5.mp4',
      'https://res.cloudinary.com/dfvgbxwed/video/upload/v1712187796/cReddit/umza5msxgjrqsijqt0kn.mp4',
      'https://res.cloudinary.com/dfvgbxwed/video/upload/v1712187823/cReddit/ri4hh96pzeo99vcv5kjt.mp4',
      'https://res.cloudinary.com/dfvgbxwed/image/upload/v1712189603/cReddit/vtlfqumkvzzhcecfx1qb.png',
      'https://res.cloudinary.com/dfvgbxwed/video/upload/v1712189944/cReddit/ggia1spudhvuwqulvxto.mp4',
      'https://res.cloudinary.com/dfvgbxwed/image/upload/v1712201118/cReddit/vibm93ekhji0qpmjnzvl.png'
    ]

    posts.push({
      _id: postIDs[i],
      username: faker.helpers.arrayElement(usernames),
      communityName: faker.helpers.arrayElement(communityNames),
      title: faker.lorem.sentence(),
      content: faker.helpers.arrayElement(Images),
      pollOptions: [],
      expirationDate: null,
      upvote: upvotes,
      downvote: downvotes,
      netVote: upvotes - downvotes,
      views: faker.number.int({ min: 0, max: 100000 }),
      isSpoiler: faker.datatype.boolean(0.2),
      isNsfw: faker.datatype.boolean(0.2),
      isLocked: faker.datatype.boolean(0.2),
      isDeleted: faker.datatype.boolean(0.05),
      isApproved: faker.datatype.boolean(0.4),
      isEdited: faker.datatype.boolean(0.1),
      isRemoved: faker.datatype.boolean(0.05),
      followers: faker.helpers.shuffle(usernames).slice(0, 5),
      mostRecentUpvote: faker.date.recent(),
      type: 'Images & Video',
      createdAt: faker.date.recent({ days: 450 })
    })
  }
}

function createRandomPolls () {
  for (let i = postIDs.length * 3 / 4; i < postIDs.length * 7 / 8; i++) {
    const upvotes = faker.number.int({ min: 10000, max: 100000 })
    const downvotes = faker.number.int({ min: 0, max: 50000 })

    const pollOptions = [{
      text: 'test1',
      voters: []
    }, {
      text: 'test2',
      voters: []
    }, {
      text: 'test3',
      voters: []
    }, {
      text: 'test4',
      voters: []
    }, {
      text: 'test5',
      voters: []
    }]

    let potentialVoters = usernames
    for (let i = 0; i < pollOptions.length; i++) {
      const randomNumOfUsers = faker.number.int({ min: 0, max: potentialVoters.length })
      const selectedUsers = faker.helpers.shuffle(potentialVoters).slice(0, randomNumOfUsers)
      pollOptions[i].voters = selectedUsers
      potentialVoters = potentialVoters.filter(user => !selectedUsers.includes(user))
    }

    posts.push({
      _id: postIDs[i],
      username: faker.helpers.arrayElement(usernames),
      communityName: faker.helpers.arrayElement(communityNames),
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraph(),
      pollOptions: pollOptions.slice(0, faker.number.int({ min: 2, max: 5 })),
      expirationDate: faker.date.soon({ min: 0, max: 7 }),
      upvote: upvotes,
      downvote: downvotes,
      netVote: upvotes - downvotes,
      views: faker.number.int({ min: 0, max: 100000 }),
      isSpoiler: faker.datatype.boolean(0.2),
      isNsfw: faker.datatype.boolean(0.2),
      isLocked: faker.datatype.boolean(0.2),
      isDeleted: faker.datatype.boolean(0.05),
      isApproved: faker.datatype.boolean(0.4),
      isEdited: faker.datatype.boolean(0.1),
      isRemoved: faker.datatype.boolean(0.05),
      followers: faker.helpers.shuffle(usernames).slice(0, 5),
      mostRecentUpvote: faker.date.recent(),
      type: 'Poll',
      createdAt: faker.date.recent({ days: 450 })
    })
  }
}

function createRandomLinks () {
  for (let i = postIDs.length * 7 / 8; i < postIDs.length; i++) {
    const upvotes = faker.number.int({ min: 10000, max: 100000 })
    const downvotes = faker.number.int({ min: 0, max: 50000 })
    const links = [
      'https://res.cloudinary.com/dfvgbxwed/video/upload/v1711805795/cReddit/exvhyjzxctf543rgpcii.mp4',
      'https://res.cloudinary.com/dfvgbxwed/video/upload/v1711817782/cReddit/cxcohmaylhmoam1o6fgb.mp4',
      'https://res.cloudinary.com/dfvgbxwed/video/upload/v1711817782/cReddit/lpuqv3dsqdpxrao9knie.mp4',
      'https://res.cloudinary.com/dfvgbxwed/video/upload/v1711817859/cReddit/kiwbhvfcwqbyalxolbw5.mp4',
      'https://res.cloudinary.com/dfvgbxwed/video/upload/v1711818207/cReddit/cifgf1a8wwikpqb5ahxg.mp4',
      'https://res.cloudinary.com/dfvgbxwed/video/upload/v1711831051/cReddit/jeheha6t84u0k4belhsm.mp4',
      'https://res.cloudinary.com/dfvgbxwed/video/upload/v1711831661/cReddit/vrtnnp14r4el9tcap4fz.mp4',
      'https://res.cloudinary.com/dfvgbxwed/video/upload/v1712160280/cReddit/xjlbzyjy0nf5tb1ykgm5.mp4',
      'https://res.cloudinary.com/dfvgbxwed/video/upload/v1712187796/cReddit/umza5msxgjrqsijqt0kn.mp4',
      'https://res.cloudinary.com/dfvgbxwed/video/upload/v1712187823/cReddit/ri4hh96pzeo99vcv5kjt.mp4',
      'https://res.cloudinary.com/dfvgbxwed/image/upload/v1712189603/cReddit/vtlfqumkvzzhcecfx1qb.png',
      'https://res.cloudinary.com/dfvgbxwed/video/upload/v1712189944/cReddit/ggia1spudhvuwqulvxto.mp4',
      'https://res.cloudinary.com/dfvgbxwed/image/upload/v1712201118/cReddit/vibm93ekhji0qpmjnzvl.png'
    ]

    posts.push({
      _id: postIDs[i],
      username: faker.helpers.arrayElement(usernames),
      communityName: faker.helpers.arrayElement(communityNames),
      title: faker.lorem.sentence(),
      content: faker.helpers.arrayElement(links),
      pollOptions: [],
      expirationDate: null,
      upvote: upvotes,
      downvote: downvotes,
      netVote: upvotes - downvotes,
      views: faker.number.int({ min: 0, max: 100000 }),
      isSpoiler: faker.datatype.boolean(0.2),
      isNsfw: faker.datatype.boolean(0.2),
      isLocked: faker.datatype.boolean(0.2),
      isDeleted: faker.datatype.boolean(0.05),
      isApproved: faker.datatype.boolean(0.4),
      isEdited: faker.datatype.boolean(0.1),
      isRemoved: faker.datatype.boolean(0.05),
      followers: faker.helpers.shuffle(usernames).slice(0, 5),
      mostRecentUpvote: faker.date.recent(),
      type: 'Link',
      createdAt: faker.date.recent({ days: 450 })
    })
  }
}

async function seedPosts () {
  createRandomPosts()
  createRandomImages()
  createRandomPolls()
  createRandomLinks()
  await PostModel.deleteMany({})
  await PostModel.insertMany(posts)
  console.log('Posts seeded')
}

module.exports = seedPosts
