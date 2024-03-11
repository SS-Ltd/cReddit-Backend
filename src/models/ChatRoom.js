const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ChatRoomSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  members: [{
    type: String,
    ref: 'User',
    refPath: 'username',
    required: true
  }],
  host: {
    type: String,
    ref: 'User',
    refPath: 'username',
    required: true
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('ChatRoom', ChatRoomSchema)
