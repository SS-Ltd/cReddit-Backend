const mongoose = require('mongoose')
const Schema = mongoose.Schema

const reportSchema = new Schema({
  user: {
    type: String,
    ref: 'User',
    refPath: 'username',
    required: true
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: 'Post'
  },
  message: {
    type: Schema.Types.ObjectId,
    ref: 'Message'
  },
  type: {
    type: String,
    enum: ['Post', 'Images & Video', 'Link', 'Poll', 'Comment', 'message'],
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
})

module.exports = mongoose.model('Report', reportSchema)
