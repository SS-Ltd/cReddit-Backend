const mongoose = require('mongoose')
const Schema = mongoose.Schema

const MessageSchema = new Schema({
  from: {
    type: String,
    ref: 'User',
    refPath: 'username',
    required: true
  },
  to: {
    type: String,
    ref: 'User',
    refPath: 'username',
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true })

module.exports = mongoose.model('Message', MessageSchema)
