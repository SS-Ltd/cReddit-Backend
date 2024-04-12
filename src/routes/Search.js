const express = require('express')
const SearchController = require('../controllers/Search')
const router = express.Router()

router.route('/users').get(SearchController.searchUsers)
router.route('/posts').get(SearchController.searchPosts)

module.exports = router