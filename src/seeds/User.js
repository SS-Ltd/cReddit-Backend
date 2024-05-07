const { faker } = require('@faker-js/faker')
const UserModel = require('../models/User')
const { usernames, posts } = require('./SeedUtils')
const bcrypt = require('bcrypt')

const users = []

async function createRandomUsers () {
  const salt = await bcrypt.genSalt(10)
  const hash = await bcrypt.hash('1', salt)
  for (let i = 0; i < usernames.length; i++) {
    users.push({
      username: usernames[i],
      displayName: faker.person.firstName(),
      email: faker.internet.email(),
      profilePicture: faker.image.avatarGitHub(),
      banner: faker.image.url({ width: 1920, height: 384 }),
      password: hash,
      about: faker.lorem.sentence(),
      gender: faker.helpers.arrayElement(['Man', 'Woman', 'I Prefer Not To Say', 'None']),
      country: faker.location.country(),
      preferences: {
        twitter: faker.string.uuid(),
        apple: faker.string.uuid(),
        google: faker.string.uuid(),
        socialLinks: [
          {
            displayName: faker.lorem.word(),
            platform: faker.lorem.word(),
            url: faker.internet.url()
          }
        ],
        isNSFW: faker.datatype.boolean(0.3),
        allowFollow: faker.datatype.boolean(0.9),
        isContentVisible: faker.datatype.boolean(0.9),
        showAdultContent: faker.datatype.boolean(0.3),
        autoPlayMedia: faker.datatype.boolean(),
        communityThemes: faker.datatype.boolean(),
        communityContentSort: faker.helpers.arrayElement(['hot', 'new', 'top', 'rising']),
        globalContentView: faker.helpers.arrayElement(['card', 'classic']),
        openNewTab: faker.datatype.boolean(0.3),
        inboxMessage: faker.datatype.boolean(0.9),
        chatMessages: faker.datatype.boolean(0.9),
        chatRequests: faker.datatype.boolean(0.3),
        mentionsNotifs: faker.datatype.boolean(),
        commentsNotifs: faker.datatype.boolean(),
        postsUpvotesNotifs: faker.datatype.boolean(0.9),
        commentsUpvotesNotifs: faker.datatype.boolean(0.9),
        RepliesNotifs: faker.datatype.boolean(0.9),
        NewFollowerNotifs: faker.datatype.boolean(0.3),
        postNotifs: faker.datatype.boolean(),
        cakeDayNotifs: faker.datatype.boolean(),
        modNotifs: faker.datatype.boolean(),
        invitationNotifs: faker.datatype.boolean(),
        followEmail: faker.datatype.boolean(),
        chatEmail: faker.datatype.boolean()
      },
      isVerified: faker.datatype.boolean(0.2),
      follows: [],
      followers: [],
      blockedUsers: [],
      mutedCommunities: [],
      communities: [],
      savedPosts: faker.helpers.shuffle(posts).slice(0, 5),
      savedComments: [],
      hiddenPosts: faker.helpers.shuffle(posts).slice(0, 5),
      upvotedPosts: faker.helpers.shuffle(posts).slice(0, 5),
      downvotedPosts: faker.helpers.shuffle(posts).slice(0, 5),
      followedPosts: [],
      approvedInCommunities: [],
      bannedInCommunities: [],
      moderatorInCommunities: [],
      darkMode: faker.datatype.boolean(0.9),
      modMode: faker.datatype.boolean(0.3),
      refreshToken: faker.string.uuid(),
      isDeleted: faker.datatype.boolean(0.1)
    })
  }
}

async function seedUsers () {
  await createRandomUsers()
  await UserModel.deleteMany({})
  await UserModel.insertMany(users)
  console.log('Users seeded')
}

module.exports = seedUsers
