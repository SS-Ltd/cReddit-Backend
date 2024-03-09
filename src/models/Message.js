const mongoose = require('mongoose')
const Schema = mongoose.Schema

const MessageSchema = new Schema({
  from: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  to: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  subject: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  isDead: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
})

module.exports = mongoose.model('Message', MessageSchema)
