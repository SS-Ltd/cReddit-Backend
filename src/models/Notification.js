const mongoose = require('mongoose')
const Schema = mongoose.Schema

const NotificationSchema = new Schema({
  user: {
    type: String,
    ref: 'User',
    refPath: 'username'
  },
  type: {
    type: String,
    enum: ['message', 'chatMessage', 'chatRequest', 'mention', 'comment', 'upvotedPost', 'upvotedComent', 'repliesComment', 'follow', 'cakeDay']
  },
  resourceId: {
    type: Schema.Types.ObjectId
  },
  title: {
    type: String
  },
  content: {
    type: String
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, { timestamps: true })

module.exports = mongoose.model('Notification', NotificationSchema)
