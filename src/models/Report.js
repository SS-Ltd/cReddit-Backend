const mongoose = require('mongoose')
const Schema = mongoose.Schema

const reportSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
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
    enum: ['post', 'message', 'comment'],
    required: true
  },
  reason: {
    type: String,
    enum: ['spam', 'inappropriate', 'hate speech', 'violence', 'other'],
    required: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
})

module.exports = mongoose.model('Report', reportSchema)
