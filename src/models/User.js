const mongoose = require('mongoose')
const Schema = mongoose.Schema
const crypto = require('crypto')
const bcrypt = require('bcrypt')

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
    type: String
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
    type: Schema.Types.ObjectId,
    ref: 'Post'
  }],
  savedComments: [{
    type: Schema.Types.ObjectId,
    ref: 'Comment'
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
    type: Schema.Types.ObjectId,
    ref: 'Post'
  }],
  upvotedPosts: [{
    type: Schema.Types.ObjectId,
    ref: 'Post'
  }],
  downvotedPosts: [{
    type: Schema.Types.ObjectId,
    ref: 'Post'
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

  const salt = await bcrypt.genSalt(10)
  const hashedToken = await bcrypt.hash(resetToken, salt)

  this.resetPasswordToken = hashedToken
  this.resetPasswordTokenExpire = Date.now() + 10 * 60 * 1000

  return resetToken
}

module.exports = mongoose.model('User', UserSchema)
