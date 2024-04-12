const mongoose = require('mongoose')
const Schema = mongoose.Schema

const HistorySchema = new Schema({
  owner: {
    type: String,
    required: true,
    ref: 'User',
    refPath: 'username'
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  }
}, {
  timestamps: true
})

HistorySchema.statics.getUserHistory = async function (options) {
  const { username, page, limit } = options

  return await this.aggregate([
    {
      $match: {
        owner: username
      }
    },
    {
      $lookup: {
        from: 'posts',
        localField: 'post',
        foreignField: '_id',
        as: 'postData'
      }
    },
    {
      $unwind: {
        path: '$postData'
      }
    },
    {
      $match: {
        'postData.isDeleted': false,
        'postData.isRemoved': false,
        'posts.type': { $ne: 'Comment' }
      }
    },
    {
      $sort: {
        createdAt: -1
      }
    },
    {
      $skip: (page - 1) * limit
    },
    {
      $limit: limit
    },
    {
      $lookup: {
        from: 'posts',
        let: { post_id: '$postData._id', type: 'Comment' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$postID', '$$post_id'] },
                  { $eq: ['$type', '$$type'] }
                ]
              }
            }
          },
          {
            $count: 'commentCount'
          }
        ],
        as: 'commentCount'
      }
    },
    {
      $lookup: {
        from: 'communities',
        localField: 'postData.communityName',
        foreignField: 'name',
        as: 'community'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'postData.username',
        foreignField: 'username',
        as: 'user'
      }
    },
    {
      $project: {
        _id: '$postData._id',
        type: '$postData.type',
        username: '$postData.username',
        communityName: '$postData.communityName',
        profilePicture: {
          $cond: {
            if: { $eq: ['$postData.communityName', null] },
            then: { $arrayElemAt: ['$user.profilePicture', 0] },
            else: { $arrayElemAt: ['$community.icon', 0] }
          }
        },
        netVote: '$postData.netVote',
        commentCount: { $ifNull: [{ $arrayElemAt: ['$commentCount.commentCount', 0] }, 0] },
        isSpoiler: '$postData.isSpoiler',
        isNSFW: '$postData.isNsfw',
        isApproved: '$postData.isApproved',
        isLocked: '$postData.isLocked',
        isEdited: '$postData.isEdited',
        title: '$postData.title',
        content: '$postData.content',
        pollOptions: '$postData.pollOptions',
        expirationDate: '$postData.expirationDate',
        createdAt: '$postData.createdAt',
        updatedAt: '$postData.updatedAt'
      }
    }
  ])
}

module.exports = mongoose.model('History', HistorySchema)
