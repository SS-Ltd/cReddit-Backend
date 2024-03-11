const mongoose = require('mongoose')
const Schema = mongoose.Schema

// TODO: Check the dbdiagram Schema for updates to the moderator table

const ModeratorSchema = new Schema({
  user: {
    type: String,
    ref: 'User',
    refPath: 'username',
    required: true
  },
  community: {
    type: String,
    ref: 'Community',
    refPath: 'name',
    required: true
  },
  // History of edited comments/post
  postsHistory: [{
    type: Schema.Types.ObjectId,
    ref: 'Post'
  }],
  commentsHistory: [{
    type: Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  // Unmoderated spam reports
  unmoderated: [{
    type: Schema.Types.ObjectId,
    ref: 'Post'
  }],
  isAccepted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('Moderator', ModeratorSchema)
