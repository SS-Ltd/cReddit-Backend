const express = require('express')
const post = require('../controllers/Post')
const multer = require('../utils/Multer')
const router = express.Router()
const { isLoggedIn, verifyToken } = require('../middlewares/Verify')
const { isPrivate, isBlocked } = require('../middlewares/VerifyModerator')

router.route('/').post(verifyToken, multer.uploadMultipleImages, post.createPost)
router.route('/home-feed').get(isLoggedIn, post.getHomeFeed)
router.route('/popular').get(isLoggedIn, post.getPopular)
router.route('/:postId/save').patch(verifyToken, isPrivate, post.savePost)
router.route('/:postId/hidden').patch(verifyToken, isPrivate, post.hidePost)
router.route('/:postId/lock').patch(verifyToken, isPrivate, post.lockPost)
router.route('/:postId/approve').patch(verifyToken, isPrivate, post.acceptPost)
router.route('/:postId/remove').patch(verifyToken, isPrivate, post.removePost)
router.route('/:postId/comments').get(isLoggedIn, isPrivate, post.getComments)
router.route('/:postId/upvote').patch(verifyToken, (req, res, next) => { req.type = 'upvote'; next() }, isPrivate, isBlocked, post.votePost)
router.route('/:postId/downvote').patch(verifyToken, (req, res, next) => { req.type = 'downvote'; next() }, isPrivate, isBlocked, post.votePost)
router.route('/:postId/vote-poll').patch(verifyToken, (req, res, next) => { req.type = 'votePoll'; next() }, isPrivate, isBlocked, post.votePost)
router.route('/:postId/report').post(verifyToken, isPrivate, post.reportPost)
router.route('/:postId/mark-spoiler').patch(verifyToken, isPrivate, post.markSpoiler)
router.route('/:postId/mark-nsfw').patch(verifyToken, isPrivate, post.markNSFW)
router.route('/:postId').get(isLoggedIn, isPrivate, post.getPost).delete(verifyToken, isPrivate, post.deletePost).patch(verifyToken, isPrivate, post.editPost)

module.exports = router
