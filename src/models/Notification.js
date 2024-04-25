const mongoose = require('mongoose')
const Schema = mongoose.Schema

const NotificationSchema = new Schema({
  user: {
    type: String,
    ref: 'User',
    refPath: 'username'
  },
  notificationFrom: {
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

NotificationSchema.statics.getNotifications = async function (options) {
  const { username, page, limit } = options
  return await this.model('Notification').aggregate([
    {
      $match: {
        user: username
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'notificationFrom',
        foreignField: 'username',
        as: 'userNotif'
      }
    },
    {
      $match: { userNotif: { $ne: [] } }
    },
    {
      $skip: (page - 1) * limit
    },
    {
      $limit: limit
    },
    {
      $addFields: {
        profilePicture: { $arrayElemAt: ['$userNotif.profilePicture', 0] }
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $project: {
        userNotif: 0
      }
    }
  ])
}

module.exports = mongoose.model('Notification', NotificationSchema)
