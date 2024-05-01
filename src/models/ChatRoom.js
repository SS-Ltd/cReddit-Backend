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

// TODO: Reseed and test this out

ChatRoomSchema.statics.getRooms = async function (username) {
  return await this.aggregate([
    {
      $match: {
        $or: [
          { members: { $in: [username] } },
          { host: username }
        ]
      }
    },
    {
      $lookup: {
        from: 'chatmessages',
        localField: '_id',
        foreignField: 'room',
        as: 'messages'
      }
    },
    {
      $unwind: '$messages'
    },
    {
      $sort: {
        'messages.createdAt': -1
      }
    },
    {
      $group: {
        _id: '$_id',
        room: { $first: '$$ROOT' },
        lastSentMessage: { $first: '$messages' }
      }
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: ['$room', { lastSentMessage: '$lastSentMessage' }]
        }
      }
    },
    {
      $project: {
        messages: 0
      }
    }
  ])
}

module.exports = mongoose.model('ChatRoom', ChatRoomSchema)
