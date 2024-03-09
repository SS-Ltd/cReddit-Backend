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
    enum: ['message', 'chatMessage', 'chatRequest', 'mention', 'comment', 'upvotesPost', 'upvotesComent', 'repliesComment', 'follow', 'followedPost', 'followedComment']
  },
  resourceId: {
    type: Schema.Types.ObjectId
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, { timestamps: true })

module.exports = mongoose.model('Notification', NotificationSchema)
