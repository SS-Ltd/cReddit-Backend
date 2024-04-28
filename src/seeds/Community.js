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
    const approvedUsers = usernamesWithoutOwner.slice(usernamesWithoutOwner.length / 2, 2)

    communities.push({
      _id: communityIDs[i],
      owner: ownerName,
      name: communityNames[i],
      banner: faker.image.url(),
      icon: faker.image.url(),
      topic: faker.lorem.sentence(),
      description: faker.lorem.paragraph(),
      settings: {
        allowedPostTypes: faker.helpers.arrayElement(['Any', 'Links', 'Posts']),
        allowCrossPosting: faker.datatype.boolean(),
        allowSpoiler: faker.datatype.boolean(0.9),
        allowImages: faker.datatype.boolean(0.9),
        allowPolls: faker.datatype.boolean(0.9),
        suggestedSort: faker.helpers.arrayElement(['best', 'old', 'top', 'new']),
        allowImageComments: faker.datatype.boolean(0.9)
      },
      type: faker.helpers.arrayElement(['public', 'private', 'restricted']),
      isNSFW: faker.datatype.boolean(0.2),
      members: faker.number.int({ min: 1, max: numOfUsernames }),
      moderators,
      bannedUsers,
      mutedUsers,
      approvedUsers,
      isDeleted: faker.datatype.boolean(0.05),
      rules: {
        text: faker.lorem.sentence(),
        appliesTo: faker.helpers.arrayElement(['Posts & comments', 'Posts only', 'Comments only'])
      }
    })

    const user = await UserModel.findOne({ username: ownerName })
    user.communities.push(communityNames[i])
    user.moderatorInCommunities.push(communityNames[i])

    const userNotOwner = await UserModel.findOne({ username: usernamesWithoutOwner[0] })
    userNotOwner.communities.push(communityNames[i])
    userNotOwner.moderatorInCommunities.push(communityNames[i])

    mutedUsers.forEach(async username => {
      const user = await UserModel.findOne({ username: username })
      user.mutedInCommunities.push(communityNames[i])
      user.communities.push(communityNames[i])
      await user.save()
    })

    bannedUsers.forEach(async username => {
      const user = await UserModel.findOne({ username: username })
      user.bannedInCommunities.push(communityNames[i])
      user.communities.push(communityNames[i])
      await user.save()
    })

    approvedUsers.forEach(async username => {
      const user = await UserModel.findOne({ username: username })
      user.approvedInCommunities.push(communityNames[i])
      user.communities.push(communityNames[i])
      await user.save()
    })

    await user.save()
    await userNotOwner.save()
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
