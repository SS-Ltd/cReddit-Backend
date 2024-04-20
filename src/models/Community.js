const mongoose = require('mongoose')
const { faker } = require('@faker-js/faker')
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
    type: String,
    default: faker.image.avatar()
  },
  topic: {
    type: String
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
    enum: ['best', 'old', 'top', 'new'],
    default: 'best'
  },
  rules: [
    {
      text: {
        type: String
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
    },
    {
      $lookup: {
        from: 'comments',
        localField: 'post._id',
        foreignField: 'postID',
        as: 'comments'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'post.username',
        foreignField: 'username',
        as: 'user'
      }
    },
    {
      $project: {
        post: 1,
        commentCount: {
          $size: '$comments'
        },
        userPic: {
          $arrayElemAt: ['$user.profilePicture', 0]
        }
      }
    }
  ])
}

CommunitySchema.statics.searchCommunities = async function (options) {
  const { page, limit, query, safeSearch, autocomplete } = options
  return await this.aggregate([
    {
      $search: {
        index: 'communitySearchIndex',
        compound: {
          should: [
            {
              autocomplete: {
                query: query,
                path: 'name',
                tokenOrder: 'sequential',
                score: {
                  boost: {
                    value: 5
                  }
                }
              }
            },
            ...(!autocomplete
              ? [
                  {
                    text: {
                      query: query,
                      path: 'description',
                      score: {
                        boost: {
                          value: 1
                        }
                      }
                    }
                  }
                ]
              : [])
          ]
        }
      }
    },
    {
      $match: {
        isDeleted: false,
        ...(safeSearch ? { isNSFW: false } : {})
      }
    },
    {
      $sort: { score: { $meta: 'textScore' } }
    },
    {
      $skip: (page - 1) * limit
    },
    {
      $limit: limit
    },
    {
      $project: {
        _id: 0,
        name: 1,
        description: 1,
        icon: 1,
        isNSFW: 1,
        members: 1
      }
    }
  ])
}

module.exports = mongoose.model('Community', CommunitySchema)
