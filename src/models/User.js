const mongoose = require('mongoose')
const Schema = mongoose.Schema

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
    type: String,
    required: true
  },
  salt: {
    type: String,
    required: true
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
  follows: [
    {
      username: {
        type: String
      }
    }
  ],
  followers: [
    {
      username: {
        type: String
      }
    }
  ],
  blockedUsers: [
    {
      username: {
        type: String
      }
    }
  ],
  mutedCommunities: [
    {
      name: {
        type: String
      }
    }
  ],
  communities: [
    {
      name: {
        type: String,
        ref: 'Community',
        refPath: 'name'
      }
    }
  ],
  savedPosts: [
    {
      post_id: {
        type: Schema.Types.ObjectId,
        ref: 'Post'
      }
    }
  ],
  savedComments: [
    {
      comment_id: {
        type: Schema.Types.ObjectId,
        ref: 'Comment'
      }
    }
  ],
  hiddenPosts: [
    {
      post_id: {
        type: Schema.Types.ObjectId,
        ref: 'Post'
      }
    }
  ],
  upvotedPosts: [
    {
      post_id: {
        type: Schema.Types.ObjectId,
        ref: 'Post'
      }
    }
  ],
  downvotePosts: [
    {
      post_id: {
        type: Schema.Types.ObjectId,
        ref: 'Post'
      }
    }
  ],
  followedPosts: [
    {
      post_id: {
        type: Schema.Types.ObjectId,
        ref: 'Post'
      }
    }
  ],
  approvedInCommunities: [
    {
      name: {
        type: String,
        ref: 'Community',
        refPath: 'name'
      }
    }
  ],
  bannedInCommunities: [
    {
      name: {
        type: String,
        ref: 'Community',
        refPath: 'name'
      }
    }
  ],
  moderatorInCommunities: [
    {
      name: {
        type: String,
        ref: 'Community',
        refPath: 'name'
      }
    }
  ],
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
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true })

module.exports = mongoose.model('User', UserSchema)
