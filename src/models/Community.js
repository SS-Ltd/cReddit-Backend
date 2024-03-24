const mongoose = require('mongoose')
const Schema = mongoose.Schema

const CommunitySchema = new Schema({
  owner: {
    type: String,
    required: true,
    ref: 'User',
    refPath: 'username'
  },
  name: {
    type: String,
    required: true,
    unique: true
  },
  banner: {
    type: String
  },
  icon: {
    type: String
  },
  topic: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  type: {
    type: String,
    enum: ['public', 'private', 'restricted'],
    default: 'public'
  },
  isNSFW: {
    type: Boolean,
    default: false
  },
  members: {
    type: Number,
    default: 1
  },
  moderators: [
    {
      type: String,
      ref: 'User',
      refPath: 'username'
    }
  ],
  bannedUsers: [
    {
      type: String,
      ref: 'User',
      refPath: 'username'
    }
  ],
  mutedUsers: [
    {
      type: String,
      ref: 'User',
      refPath: 'username'
    }
  ],
  isDeleted: {
    type: Boolean,
    default: false
  },
  suggestedSort: {
    type: String,
    enum: ['Best', 'Old', 'Top', 'Q&A', 'Controversial', 'New'],
    default: 'Old'
  },
  rules: [
    {
      text: {
        type: String,
        required: true
      },
      appliesTo: {
        type: String,
        enum: ['Posts & comments', 'Posts only', 'Comments only'],
        default: 'Posts & comments'
      }
    }
  ]
}, {
  timestamps: true
})

CommunitySchema.methods.getEditedPosts = async function (options) {
  const { page, limit } = options
  return await this.model('Community').aggregate([
    {
      $match: {
        name: this.name
      }
    },
    {
      $lookup: {
        from: 'posts',
        localField: 'name',
        foreignField: 'communityName',
        as: 'post'
      }
    },
    {
      $project: {
        post: 1
      }
    },
    {
      $unwind: {
        path: '$post'
      }
    },
    {
      $match: {
        'post.isEdited': true,
        'post.isDeleted': false
      }
    },
    {
      $sort: {
        'post.createdAt': -1
      }
    },
    {
      $skip: (page - 1) * limit
    },
    {
      $limit: limit
    }
  ])
}

module.exports = mongoose.model('Community', CommunitySchema)
