const mongoose = require('mongoose')
const Schema = mongoose.Schema

const CommentSchema = new Schema({
  postID: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Post'
  },
  username: {
    type: String,
    required: true,
    ref: 'User',
    refPath: 'username'
  },
  parentID: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Comment'
  },
  communityID: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Community'
  },
  content: {
    type: String,
    required: true
  },
  upvote: {
    type: Number,
    default: 0
  },
  downvote: {
    type: Number,
    default: 0
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
})

module.exports = mongoose.model('Comment', CommentSchema)
