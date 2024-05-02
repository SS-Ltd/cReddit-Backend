const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ReactionSchema = new Schema({
  type: {
    type: String,
    required: true
  },
  users: [{
    type: String,
    ref: 'User',
    refPath: 'username'
  }]
})

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
  reactions: [ReactionSchema],
  isDeleted: {
    type: Boolean,
    default: false
  }
})

module.exports = mongoose.model('ChatMessage', ChatMessageSchema)
