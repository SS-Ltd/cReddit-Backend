const { faker } = require('@faker-js/faker')
const CommunityModel = require('../models/Community')
const UserModel = require('../models/User')
const { usernames, communityNames, communityIDs } = require('./SeedUtils')

const communities = []

async function createRandomCommunities () {
  const numOfUsernames = usernames.length

  for (let i = 0; i < communityNames.length; i++) {
    const shuffledUsernames = usernames.sort(() => 0.5 - Math.random())
    const ownerIndex = Math.floor(Math.random() * numOfUsernames)
    const ownerName = usernames[ownerIndex]
    const usernamesWithoutOwner = shuffledUsernames.filter((_, index) => index !== ownerIndex)
    const moderators = [ownerName, usernamesWithoutOwner[0]]
    const bannedUsers = usernamesWithoutOwner.slice(usernamesWithoutOwner.length / 2, usernamesWithoutOwner.length + 1)
    const mutedUsers = usernamesWithoutOwner.slice(usernamesWithoutOwner.length / 2, 2)

    communities.push({
      _id: communityIDs[i],
      owner: ownerName,
      name: communityNames[i],
      banner: faker.image.url(),
      icon: faker.image.url(),
      topic: faker.lorem.sentence(),
      description: faker.lorem.paragraph(),
      type: faker.helpers.arrayElement(['public', 'private', 'restricted']),
      isNSFW: faker.datatype.boolean(0.2),
      members: faker.number.int({ min: 1, max: numOfUsernames }),
      moderators,
      bannedUsers,
      mutedUsers,
      isDeleted: faker.datatype.boolean(0.05),
      suggestedSort: faker.helpers.arrayElement(['best', 'old', 'top', 'new']),
      rules: {
        text: faker.lorem.sentence(),
        appliesTo: faker.helpers.arrayElement(['Posts & comments', 'Posts only', 'Comments only'])
      }
    })

    const user = await UserModel.findOne({ username: ownerName })
    user.communities.push(communityNames[i])
    user.moderatorInCommunities.push(communityNames[i])

    await user.save()
  }

  for (let i = 0; i < usernames.length; i++) {
    const user = await UserModel.findOne({ username: usernames[i] })

    for (let j = 0; j < 5; j++) {
      const randomIndex = Math.floor(Math.random() * communityNames.length)
      if (!user.communities.includes(communityNames[randomIndex])) {
        user.communities.push(communityNames[randomIndex])
      }
    }

    await user.save()
  }
}

async function seedCommunities () {
  await createRandomCommunities()
  await CommunityModel.deleteMany({})
  await CommunityModel.insertMany(communities)
  console.log('Communities seeded')
}

module.exports = seedCommunities
