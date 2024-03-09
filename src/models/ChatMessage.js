const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ChatMessageSchema = new Schema({
  user: {
    type: String,
    ref: 'User',
    refPath: 'user',
    required: true
  },
  room: {
    type: Schema.Types.ObjectId,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  reactions: [{
    type: String,
    users: [{
      type: String,
      ref: 'User',
      refPath: 'user'
    }]
  }]
})

module.exports = mongoose.model('ChatMessage', ChatMessageSchema)
