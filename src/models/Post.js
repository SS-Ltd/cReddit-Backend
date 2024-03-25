const mongoose = require('mongoose')
const Schema = mongoose.Schema

const PostSchema = new Schema({
  type: {
    type: String,
    required: true,
    enum: ['Post', 'Image & Video', 'Link', 'Poll']
  },
  username: {
    type: String,
    required: true,
    ref: 'User',
    refPath: 'username'
  },
  communityName: {
    type: String,
    ref: 'Community',
    refPath: 'name'
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String
  },
  pollOptions: [{
    text: {
      type: String,
      required: true
    },
    votes: {
      type: Number,
      default: 0
    }
  }],
  expirationDate: {
    type: Date
  },
  upvote: {
    type: Number,
    default: 0
  },
  downvote: {
    type: Number,
    default: 0
  },
  netVote: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  isSpoiler: {
    type: Boolean,
    default: false
  },
  isNsfw: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  isRemoved: {
    type: Boolean,
    default: false
  },
  followers: [{
    type: String,
    ref: 'User',
    refPath: 'username'
  }],
  actions: [{
    moderator: {
      type: String,
      ref: 'User',
      refPath: 'username'
    },
    action: {
      type: String,
      enum: ['remove', 'lock', 'approve']
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  mostRecentUpvote: {
    type: Date
  }
}, { timestamps: true })

PostSchema.methods.getCommentCount = async function () {
  const postId = this._id
  return await this.model('Post').aggregate([
    {
      $match: { _id: postId }
    },
    {
      $lookup: {
        from: 'comments',
        localField: '_id',
        foreignField: 'postID',
        as: 'comments'
      }
    },
    {
      $project: {
        commentCount: { $size: '$comments' }
      }
    }
  ])
}

PostSchema.methods.getComments = async function (options) {
  const { random, sort, limit } = options
  const postId = this._id
  if (random) {
    return await this.model('Post').aggregate([
      {
        $match: { _id: postId }
      },
      {
        $lookup: {
          from: 'comments',
          let: { postId: '$_id' },
          pipeline: [
            {
              $match: { $expr: { $eq: ['$postID', '$$postId'] } }
            },
            {
              $sample: { size: limit }
            }
          ],
          as: 'comments'
        }
      },
      {
        $project: {
          comments: 1
        }
      }
    ]
    )
  }

  return await this.model('Post').aggregate([
    {
      $match: { _id: postId }
    },
    {
      $lookup: {
        from: 'comments',
        let: { postId: '$_id' },
        pipeline: [
          {
            $match: { $expr: { $eq: ['$postID', '$$postId'] } }
          },
          {
            $sort: sort
          },
          {
            $limit: limit
          }
        ],
        as: 'comments'
      }
    },
    {
      $project: {
        comments: 1
      }
    }
  ])
}

module.exports = mongoose.model('Post', PostSchema)
