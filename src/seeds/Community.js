const { faker } = require('@faker-js/faker')
const CommunityModel = require('../models/Community')
const { usernames, communityNames, communityIDs } = require('./SeedUtils')
const { all } = require('axios')

const communities = []

function createRandomCommunities () {
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
      settings: {
        general: {
          allowedPostTypes: faker.helpers.arrayElement(['Any', 'Links', 'Posts']),
          allowCrossPosting: faker.datatype.boolean(0.9),
          allowSpoiler: faker.datatype.boolean(0.9),
          allowImages: faker.datatype.boolean(0.9),
          allowPolls: faker.datatype.boolean(0.9),
          suggestedSort: faker.helpers.arrayElement(['best', 'old', 'top', 'new']),
          allowImageComments: faker.datatype.boolean(0.9)
        }
      },
      rules: {
        text: faker.lorem.sentence(),
        appliesTo: faker.helpers.arrayElement(['Posts & comments', 'Posts only', 'Comments only'])
      }
    })
  }
}

async function seedCommunities () {
  createRandomCommunities()
  await CommunityModel.deleteMany({})
  await CommunityModel.insertMany(communities)
  console.log('Communities seeded')
}

module.exports = seedCommunities
