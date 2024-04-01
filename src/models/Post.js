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

module.exports = mongoose.model('Post', PostSchema)
