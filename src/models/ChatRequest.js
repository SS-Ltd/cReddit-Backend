const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ChatRequestSchema = new Schema({
  user: {
    type: String,
    ref: 'User',
    refPath: 'userName',
    required: true
  },
  room: {
    type: Schema.Types.ObjectId,
    ref: 'ChatRoom'
  },
  inviter: {
    type: String,
    ref: 'User',
    refPath: 'userName',
    required: true
  }
})

module.exports = mongoose.model('ChatRequest', ChatRequestSchema)
