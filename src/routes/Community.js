const express = require('express')
const router = express.Router()
const community = require('../controllers/Community')

router.route('/top').get(community.getTopCommunities) // NOTE: we will add  verify token middleware here

module.exports = router
