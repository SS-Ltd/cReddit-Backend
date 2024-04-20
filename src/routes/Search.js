const SearchController = require('../controllers/Search')
const express = require('express')
const router = express.Router()

router.route('/users').get(SearchController.searchUsers)
router.route('/posts').get(SearchController.searchPosts)
router.route('/comments').get(SearchController.searchComments)
router.route('/communities').get(SearchController.searchCommunities)
router.route('/hashtags').get(SearchController.searchHashtags)

module.exports = router
