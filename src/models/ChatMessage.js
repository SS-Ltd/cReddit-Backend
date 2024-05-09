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
    refPath: 'username'
  },
  room: {
    type: Schema.Types.ObjectId,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  reactions: [ReactionSchema],
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true })

ChatMessageSchema.statics.getChatMessages = async function (page, limit, roomId, date) {
  return await this.aggregate([
    {
      $match: {
        room: new mongoose.Types.ObjectId(roomId),
        isDeleted: false,
        createdAt: { $lte: date }
      }
    },
    { $sort: { createdAt: -1 } },
    { $skip: page * limit },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: 'username',
        as: 'user'
      }
    },
    {
      $addFields: {
        profilePicture: { $arrayElemAt: ['$user.profilePicture', 0] },
        username: { $arrayElemAt: ['$user.username', 0] }
      }
    },
    {
      $project: {
        user: 0
      }
    }
  ])
}

module.exports = mongoose.model('ChatMessage', ChatMessageSchema)
