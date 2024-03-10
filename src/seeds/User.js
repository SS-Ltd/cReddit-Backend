const { faker } = require('@faker-js/faker')
const UserModel = require('../models/User')

function createRandomUsers () {
  return {
    username: 'ItzFarosa18',
    displayName: faker.person.firstName(),
    email: faker.internet.email(),
    password: faker.internet.password(),
    profilePicture: faker.image.url(),
    banner: faker.image.url(),
    about: faker.lorem.sentence(),
    gender: faker.helpers.arrayElement(['Man', 'Woman', 'I Prefer Not To Say', 'None']),
    country: faker.location.country(),
    preferences: {
      twitter: faker.string.uuid(),
      apple: faker.string.uuid(),
      google: faker.string.uuid(),
      socialLinks: [
        {
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
      mentionsNotif: faker.datatype.boolean(),
      commentsNotif: faker.datatype.boolean(),
      postsUpvotesNotif: faker.datatype.boolean(0.9),
      commentsUpvotesNotif: faker.datatype.boolean(0.9),
      RepliesNotif: faker.datatype.boolean(0.9),
      NewFollowerNotif: faker.datatype.boolean(0.3),
      postNotif: faker.datatype.boolean(),
      cakeDayNotif: faker.datatype.boolean(),
      modNotif: faker.datatype.boolean(),
      invitationNotif: faker.datatype.boolean(),
      followEmail: faker.datatype.boolean(),
      chatEmail: faker.datatype.boolean()
    },
    // Need to find a better seeding technique involving relations
    isVerified: faker.datatype.boolean(0.2),
    follows: [],
    followers: [],
    blockedUsers: [],
    mutedCommunities: [],
    communities: [],
    savedPosts: [],
    savedComments: [],
    hiddenPosts: [],
    upvotedPosts: [],
    downvotedPosts: [],
    followedPosts: [],
    approvedInCommunities: [],
    bannedInCommunities: [],
    moderatorInCommunities: [],
    darkMode: faker.datatype.boolean(0.9),
    modMode: faker.datatype.boolean(0.3),
    refreshToken: faker.string.uuid(),
    isDeleted: faker.datatype.boolean(0.1)
  }
}

async function seedUsers () {
  const users = []
  users.push(createRandomUsers())
  await UserModel.deleteMany({})
  await UserModel.insertMany(users)
  console.log('Users seeded')
}

module.exports = seedUsers
