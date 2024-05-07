const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ChatRoomSchema = new Schema({
  name: {
    type: String
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
    refPath: 'username'
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

// TODO: Reseed and test this out

ChatRoomSchema.statics.getRooms = async function (page, limit, username) {
  return await this.aggregate([
    {
      $match: { members: { $in: [username] }, isDeleted: false }
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
      $unwind: {
        path: '$messages',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $group: {
        _id: '$_id',
        room: { $first: '$$ROOT' },
        lastSentMessage: { $last: '$messages' }
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
      $addFields: {
        name: {
          $cond: {
            if: { $eq: [{ $size: '$members' }, 2] },
            then: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: '$members',
                    as: 'member',
                    cond: { $ne: ['$$member', username] }
                  }
                },
                0
              ]
            },
            else: '$name'
          }
        },
        sortBy: {
          $ifNull: ['$lastSentMessage.createdAt', '$createdAt']
        }
      }
    },
    {
      $sort: {
        sortBy: -1
      }
    },
    { $skip: page * limit },
    { $limit: limit },
    {
      $project: {
        messages: 0,
        sortBy: 0
      }
    }
  ])
}

module.exports = mongoose.model('ChatRoom', ChatRoomSchema)
