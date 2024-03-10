const { faker } = require('@faker-js/faker')
const HistoryModel = require('../models/History')
const { usernames, postIDs } = require('./SeedUtils')
const { HISTORY } = require('./SeedConfig')

const histories = []

function createRandomHistories () {
  for (let i = 0; i < HISTORY; i++) {
    histories.push({
      owner: faker.helpers.arrayElement(usernames),
      post: faker.helpers.arrayElement(postIDs)
    })
  }
}

async function seedHistories () {
  createRandomHistories()
  await HistoryModel.deleteMany({})
  await HistoryModel.insertMany(histories)
  console.log('Histories seeded')
}

module.exports = seedHistories
