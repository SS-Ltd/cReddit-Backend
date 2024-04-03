const mongoose = require('mongoose')
const Schema = mongoose.Schema
const crypto = require('crypto')
const { faker } = require('@faker-js/faker')

const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  displayName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String
  },
  profilePicture: {
    type: String,
    default: faker.image.avatar()
  },
  banner: {
    type: String
  },
  about: {
    type: String
  },
  gender: {
    type: String,
    enum: ['Man', 'Woman', 'I Prefer Not To Say', 'None'],
    default: 'None'
  },
  country: {
    type: String
  },
  preferences: {
    twitter: {
      type: String
    },
    apple: {
      type: String
    },
    google: {
      type: String
    },
    socialLinks: [
      {
        displayName: {
          type: String
        },
        platform: {
          type: String
        },
        url: {
          type: String
        }
      }
    ],
    isNSFW: {
      type: Boolean,
      default: false
    },
    allowFollow: {
      type: Boolean,
      default: true
    },
    isContentVisible: {
      type: Boolean,
      default: true
    },
    showAdultContent: {
      type: Boolean,
      default: false
    },
    autoPlayMedia: {
      type: Boolean,
      default: true
    },
    communityThemes: {
      type: Boolean,
      default: true
    },
    communityContentSort: {
      type: String,
      enum: ['hot', 'new', 'top', 'rising'],
      default: 'hot'
    },
    globalContentView: {
      type: String,
      enum: ['card', 'classic'],
      default: 'card'
    },
    openNewTab: {
      type: Boolean,
      default: false
    },
    inboxMessages: {
      type: Boolean,
      default: true
    },
    chatMessages: {
      type: Boolean,
      default: true
    },
    chatRequests: {
      type: Boolean,
      default: true
    },
    mentionsNotifs: {
      type: Boolean,
      default: true
    },
    commentsNotifs: {
      type: Boolean,
      default: true
    },
    postsUpvotesNotifs: {
      type: Boolean,
      default: true
    },
    repliesNotifs: {
      type: Boolean,
      default: true
    },
    newFollowerNotifs: {
      type: Boolean,
      default: true
    },
    postNotifs: {
      type: Boolean,
      default: true
    },
    cakeDayNotifs: {
      type: Boolean,
      default: true
    },
    modNotifs: {
      type: Boolean,
      default: true
    },
    invitaionNotifs: {
      type: Boolean,
      default: true
    },
    followEmail: {
      type: Boolean,
      default: true
    },
    chatEmail: {
      type: Boolean,
      default: true
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  follows: [{
    type: String,
    ref: 'User',
    refPath: 'username'
  }],
  followers: [{
    type: String,
    ref: 'User',
    refPath: 'username'
  }],
  blockedUsers: [{
    type: String,
    ref: 'User',
    refPath: 'username'
  }],
  mutedCommunities: [{
    type: String,
    ref: 'Community',
    refPath: 'name'
  }],
  communities: [{
    type: String,
    ref: 'Community',
    refPath: 'name'
  }],
  savedPosts: [{
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'Post'
    },
    savedAt: {
      type: Date,
      default: Date.now
    }
  }],
  savedComments: [{
    commenId: {
      type: Schema.Types.ObjectId,
      ref: 'Post'
    },
    savedAt: {
      type: Date,
      default: Date.now
    }
  }],
  upvotedComments: [{
    type: Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  downvotedComments: [{
    type: Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  hiddenPosts: [{
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'Post'
    },
    savedAt: {
      type: Date,
      default: Date.now
    }
  }],
  upvotedPosts: [{
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'Post'
    },
    savedAt: {
      type: Date,
      default: Date.now
    }
  }],
  downvotedPosts: [{
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'Post'
    },
    savedAt: {
      type: Date,
      default: Date.now
    }
  }],
  followedPosts: [{
    type: Schema.Types.ObjectId,
    ref: 'Post'
  }],
  approvedInCommunities: [{
    type: String,
    ref: 'Community',
    refPath: 'name'
  }],
  bannedInCommunities: [{
    type: String,
    ref: 'Community',
    refPath: 'name'
  }],
  moderatorInCommunities: [{
    type: String,
    ref: 'Community',
    refPath: 'name'
  }],
  darkMode: {
    type: Boolean,
    default: false
  },
  modMode: {
    type: Boolean,
    default: false
  },
  refreshToken: {
    type: String
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordTokenExpire: {
    type: Date
  },
  passwordChangedAt: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true })

UserSchema.methods.createResetPasswordToken = async function () {
  const resetToken = crypto.randomBytes(32).toString('hex')

  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex')

  this.resetPasswordToken = hashedToken
  this.resetPasswordTokenExpire = Date.now() + 10 * 60 * 1000

  return resetToken
}

// The following function returns posts using aggegation piplining method
// The function takes an object as an argument with the following properties:
// username: The username of the user -> ex. 'john_doe'
// unwind: The field to unwind -> ex. '$savedPosts'
// localField: The local field in the user model for the lookup -> ex. 'savedPosts.postId'
// savedAt: The field to sort the posts -> ex. '$savedPosts.savedAt'
// page: The page number -> ex. 1  "for PAGANATION"
// limit: The limit of posts per page -> ex. 10 "for PAGANATION"
// NOTE: be aware for the '$' sign in the examles above
UserSchema.methods.getPosts = async function (options) {
  const { username, unwind, localField, savedAt, page, limit } = options

  return await this.model('User').aggregate([
    {
      $match: { username: username }
    },
    {
      $unwind: unwind
    },
    {
      $lookup: {
        from: 'posts',
        localField: localField,
        foreignField: '_id',
        as: 'post'
      }
    },
    {
      $match: {
        'post.isDeleted': false,
        'post.isRemoved': false
      }
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
        post: {
          $arrayElemAt: ['$post', 0]
        },
        commentCount: {
          $size: '$comments'
        },
        userPic: {
          $arrayElemAt: ['$user.profilePicture', 0]
        },
        savedAt: savedAt
      }
    }
  ])
}

UserSchema.methods.getSavedComments = async function (options) {
  return await this.model('User').aggregate([
    {
      $match: { username: this.username }
    },
    {
      $unwind: '$savedComments'
    },
    {
      $lookup: {
        from: 'comments',
        localField: 'savedComments.commentId',
        foreignField: '_id',
        as: 'commentSaved'
      }
    },
    {
      $match: {
        'commentSaved.isDeleted': false
      }
    },
    {
      $sort: { 'savedComments.savedAt': -1 }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'commentSaved.username',
        foreignField: 'username',
        as: 'user'
      }
    },
    {
      $project: {
        commentSaved: {
          $arrayElemAt: ['$commentSaved', 0]
        },
        profilePic: {
          $arrayElemAt: ['$user.profilePicture', 0]
        },
        savedAt: '$savedComments.savedAt'
      }
    }
  ])
}

UserSchema.methods.getUserComments = async function (options) {
  let { username, page, limit, sort, time } = options

  switch (sort) {
    case 'new':
      sort = { 'posts.createdAt': -1, 'posts._id': -1 }
      break
    case 'top':
      sort = { 'posts.netVote': -1, 'posts.createdAt': -1, 'posts._id': -1 }
      break
    case 'hot':
      sort = { 'posts.views': -1, 'posts.createdAt': -1, 'posts._id': -1 }
      break
    default:
      sort = { 'posts.createdAt': -1, 'posts._id': -1 }
      break
  }

  return await this.model('User').aggregate([
    {
      $match: { username: username }
    },
    {
      $lookup: {
        from: 'posts',
        localField: 'username',
        foreignField: 'username',
        as: 'posts'
      }
    },
    {
      $unwind: {
        path: '$posts'
      }
    },
    {
      $match: {
        'posts.isDeleted': false,
        'posts.isRemoved': false,
        'posts.type': 'Comment',
        'posts.createdAt': time
      }
    },
    {
      $addFields: {
        'posts.isUpvoted': {
          $in: ['$posts._id', '$upvotedPosts.postId']
        },
        'posts.isDownvoted': {
          $in: ['$posts._id', '$downvotedPosts.postId']
        },
        'posts.isSaved': {
          $in: ['$posts._id', '$savedPosts.postId']
        },
        'posts.isHidden': {
          $in: ['$posts._id', '$hiddenPosts.postId']
        }
      }
    },
    {
      $sort: sort
    },
    {
      $skip: (page - 1) * limit
    },
    {
      $limit: limit
    },
    {
      $lookup: {
        from: 'communities',
        localField: 'post.communityName',
        foreignField: 'name',
        as: 'community'
      }
    },
    {
      $project: {
        _id: 0,
        postID: '$posts.postID',
        type: '$posts.type',
        isImage: '$posts.isImage',
        username: '$posts.username',
        communityName: '$posts.communityName',
        profilePicture: { $arrayElemAt: ['$community.banner', 0] },
        netVote: '$posts.netVote',
        isSpoiler: '$posts.isSpoiler',
        isNSFW: '$posts.isNSFW',
        isApproved: '$posts.isApproved',
        title: '$posts.title',
        content: '$posts.content',
        createdAt: '$posts.createdAt',
        updatedAt: '$posts.updatedAt',
        isUpvoted: '$posts.isUpvoted',
        isDownvoted: '$posts.isDownvoted',
        isSaved: '$posts.isSaved',
        isHidden: '$posts.isHidden'
      }
    }
  ])
}

module.exports = mongoose.model('User', UserSchema)
