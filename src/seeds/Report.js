const { faker } = require('@faker-js/faker')
const ReportModel = require('../models/Report')
const { usernames, postIDs, messageIDs } = require('./SeedUtils')

const reports = []

function createRandomReports () {
  for (let i = 0; i < 10; i++) {
    reports.push({
      user: usernames[Math.floor(Math.random() * usernames.length)],
      post: postIDs[Math.floor(Math.random() * postIDs.length)],
      message: messageIDs[Math.floor(Math.random() * messageIDs.length)],
      type: faker.helpers.arrayElement(['Post', 'Images & Video', 'Link', 'Poll', 'Comment', 'message']),
      reason: faker.helpers.arrayElement(['spam', 'inappropriate', 'hate speech', 'violence', 'other']),
      isDeleted: faker.datatype.boolean(0.1)
    })
  }
}

async function seedReports () {
  createRandomReports()
  await ReportModel.deleteMany({})
  await ReportModel.insertMany(reports)
  console.log('Reports seeded')
}

module.exports = seedReports
