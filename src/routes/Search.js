const SearchController = require('../controllers/Search')
const { isLoggedIn } = require('../middlewares/Verify')
const express = require('express')
const router = express.Router()

router.route('/users').get(isLoggedIn, SearchController.searchUsers)
router.route('/posts').get(SearchController.searchPosts)
router.route('/comments').get(SearchController.searchComments)
router.route('/communities').get(isLoggedIn, SearchController.searchCommunities)
router.route('/hashtags').get(SearchController.searchHashtags)

module.exports = router
