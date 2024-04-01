const mongoose = require('mongoose')
const Schema = mongoose.Schema

const PostSchema = new Schema({
  type: {
    type: String,
    required: true,
    enum: ['Post', 'Images & Video', 'Link', 'Poll', 'Comment']
  },
  child: {
    type: String,
    ref: 'Post',
    refPath: 'type'
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
    voters: {
      type: String,
      ref: 'User',
      refPath: 'username'
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
  isImage: {
    type: Boolean,
    default: false
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

PostSchema.methods.getUserProfilePicture = async function () {
  const username = this.username
  return await this.model('Post').aggregate([
    {
      $match: { username: username }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'username',
        foreignField: 'username',
        as: 'user'
      }
    },
    {
      $project: {
        profilePicture: '$user.profilePicture'
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
              $match: { postID: postId, isDeleted: false }
            },
            {
              $sample: { size: 5 }
            }
          ],
          as: 'comments'
        }
      },
      { $unwind: '$comments' },
      {
        $lookup: {
          from: 'users',
          localField: 'comments.username',
          foreignField: 'username',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $group: {
          _id: '$_id',
          post: { $first: '$$ROOT' },
          comments: {
            $push: {
              _id: '$comments._id',
              postID: '$comments.postID',
              username: '$comments.username',
              parentID: '$comments.parentID',
              communityID: '$comments.communityID',
              content: '$comments.content',
              upvote: '$comments.upvote',
              downvote: '$comments.downvote',
              netvote: '$comments.netVote',
              isEdited: '$comments.isEdited',
              isLocked: '$comments.isLocked',
              isApproved: '$comments.isApproved',
              isDeleted: '$comments.isDeleted',
              profilePicture: '$user.profilePicture',
              createdAt: '$comments.createdAt'
            }
          }
        }
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: ['$post', { comments: '$comments' }]
          }
        }
      },
      {
        $project: {
          user: 0
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
            $match: { postID: postId, isDeleted: false }
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
    { $unwind: '$comments' },
    {
      $lookup: {
        from: 'users',
        localField: 'comments.username',
        foreignField: 'username',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $group: {
        _id: '$_id',
        post: { $first: '$$ROOT' },
        comments: {
          $push: {
            _id: '$comments._id',
            postID: '$comments.postID',
            username: '$comments.username',
            parentID: '$comments.parentID',
            communityID: '$comments.communityID',
            content: '$comments.content',
            upvote: '$comments.upvote',
            downvote: '$comments.downvote',
            netvote: '$comments.netVote',
            isEdited: '$comments.isEdited',
            isLocked: '$comments.isLocked',
            isApproved: '$comments.isApproved',
            isDeleted: '$comments.isDeleted',
            profilePicture: '$user.profilePicture',
            createdAt: '$comments.createdAt'
          }
        }
      }
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: ['$post', { comments: '$comments' }]
        }
      }
    },
    {
      $project: {
        user: 0
      }
    }
  ])
}

module.exports = mongoose.model('Post', PostSchema)
