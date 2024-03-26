const mongoose = require('mongoose')
const Schema = mongoose.Schema

const PostSchema = new Schema({
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
  followers: [{
    type: String,
    ref: 'User',
    refPath: 'username'
  }]
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

module.exports = mongoose.model('Post', PostSchema)
