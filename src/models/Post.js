const mongoose = require('mongoose')
const Schema = mongoose.Schema

const PostSchema = new Schema({
  type: {
    type: String,
    required: true,
    enum: ['Post', 'Images & Video', 'Link', 'Poll', 'Comment']
  },
  child: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  postID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
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
    type: String
  },
  content: {
    type: String
  },
  pollOptions: [{
    text: {
      type: String,
      required: true
    },
    voters: [{
      type: String,
      ref: 'User',
      refPath: 'username'
    }]
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
      $match: { postID: postId, type: 'Comment', isDeleted: false }
    },
    {
      $count: 'commentCount'
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

PostSchema.methods.getCommunityProfilePicture = async function () {
  const communityName = this.communityName
  return await this.model('Post').aggregate([
    {
      $match: { communityName: communityName }
    },
    {
      $lookup: {
        from: 'communities',
        localField: 'communityName',
        foreignField: 'name',
        as: 'community'
      }
    },
    {
      $project: {
        profilePicture: '$community.profilePicture'
      }
    }
  ])
}

PostSchema.statics.getComments = async function (postId, options) {
  const { random, sort, limit, page } = options
  if (random) {
    return await this.aggregate([
      { $match: { postID: postId, type: 'Comment', isDeleted: false, isRemoved: false } },
      {
        $lookup: {
          from: 'users',
          localField: 'username',
          foreignField: 'username',
          as: 'user'
        }
      },
      { $sample: { size: limit } },
      {
        $addFields: {
          profilePicture: { $arrayElemAt: ['$user.profilePicture', 0] }
        }
      },
      {
        $project: {
          user: 0,
          __v: 0,
          isEdited: 0,
          upvote: 0,
          downvote: 0,
          isDeleted: 0,
          isRemoved: 0,
          followers: 0,
          mostRecentUpvote: 0,
          pollOptions: 0,
          actions: 0,
          views: 0,
          isNsfw: 0
        }
      }
    ])
  }

  return await this.aggregate([
    { $match: { postID: postId, type: 'Comment', isDeleted: false, isRemoved: false } },
    {
      $lookup: {
        from: 'users',
        localField: 'username',
        foreignField: 'username',
        as: 'user'
      }
    },
    { $sort: sort },
    { $skip: page * limit },
    { $limit: limit },
    {
      $addFields: {
        profilePicture: { $arrayElemAt: ['$user.profilePicture', 0] }
      }
    },
    {
      $project: {
        user: 0,
        __v: 0,
        isEdited: 0,
        upvote: 0,
        downvote: 0,
        isDeleted: 0,
        isRemoved: 0,
        followers: 0,
        mostRecentUpvote: 0,
        pollOptions: 0,
        actions: 0,
        views: 0,
        isNsfw: 0
      }
    }
  ])
}

PostSchema.statics.getPost = async function (postId) {
  return await this.aggregate([
    { $match: { _id: postId, isDeleted: false, isRemoved: false } },
    {
      $lookup: {
        from: 'posts',
        localField: '_id',
        foreignField: 'postID',
        as: 'comments'
      }
    },
    {
      $lookup: {
        from: 'communities',
        localField: 'communityName',
        foreignField: 'name',
        as: 'community'
      }
    },
    {
      $addFields: {
        commentCount: { $size: '$comments' },
        profilePicture: { $arrayElemAt: ['$community.icon', 0] }
      }
    },
    {
      $project: {
        comments: 0,
        community: 0,
        __v: 0,
        followers: 0,
        upvote: 0,
        downvote: 0,
        views: 0,
        isImage: 0,
        isDeleted: 0,
        mostRecentUpvote: 0,
        actions: 0,
        isRemoved: 0
      }
    }
  ])
}

PostSchema.statics.getComment = async function (commentId) {
  return await this.aggregate([
    { $match: { _id: commentId, isDeleted: false, isRemoved: false, type: 'Comment' } },
    {
      $lookup: {
        from: 'users',
        localField: 'username',
        foreignField: 'username',
        as: 'user'
      }
    },
    {
      $addFields: {
        profilePicture: { $arrayElemAt: ['$user.profilePicture', 0] }
      }
    },
    {
      $project: {
        user: 0,
        __v: 0,
        followers: 0,
        upvote: 0,
        downvote: 0,
        views: 0,
        isImage: 0,
        isDeleted: 0,
        mostRecentUpvote: 0,
        actions: 0,
        isRemoved: 0,
        pollOptions: 0,
        isNsfw: 0,
        expirationDate: 0
      }
    }
  ])
}

PostSchema.statics.byCommunity = async function (communityName, options, showAdultContent) {
  const { page, limit, sortMethod, time } = options
  return await this.aggregate([
    {
      $match: {
        communityName: communityName,
        createdAt: time,
        isDeleted: false,
        isRemoved: false,
        $expr: {
          $cond: {
            if: { $eq: [showAdultContent, false] },
            then: { $eq: ['$isNsfw', false] },
            else: true
          }
        }
      }
    },
    {
      $lookup: {
        from: 'posts',
        localField: '_id',
        foreignField: 'postID',
        as: 'comments'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'username',
        foreignField: 'username',
        as: 'user'
      }
    },
    { $sort: sortMethod },
    { $skip: page * limit },
    { $limit: limit },
    {
      $addFields: {
        commentCount: { $size: '$comments' },
        profilePicture: { $arrayElemAt: ['$user.profilePicture', 0] }
      }
    },
    {
      $project: {
        comments: 0,
        user: 0,
        __v: 0,
        followers: 0,
        upvote: 0,
        downvote: 0,
        views: 0,
        isImage: 0,
        isDeleted: 0,
        mostRecentUpvote: 0,
        actions: 0,
        isRemoved: 0
      }
    }
  ])
}

PostSchema.statics.getRandomHomeFeed = async function (options, mutedCommunities, showAdultContent) {
  const { limit } = options

  return await this.aggregate([
    {
      $match: {
        $and: [
          {
            $expr: {
              $cond: {
                if: { $ne: [mutedCommunities, null] },
                then: { $not: { $in: ['$communityName', mutedCommunities] } },
                else: true
              }
            }
          },
          {
            $expr: {
              $cond: {
                if: { $eq: [showAdultContent, false] },
                then: { $eq: ['$isNsfw', false] },
                else: true
              }
            }
          }
        ],
        isDeleted: false,
        isRemoved: false,
        type: { $ne: 'Comment' },
        isNsfw: showAdultContent
      }
    },
    {
      $lookup: {
        from: 'posts',
        localField: '_id',
        foreignField: 'postID',
        as: 'comments'
      }
    },
    {
      $lookup: {
        from: 'communities',
        localField: 'communityName',
        foreignField: 'name',
        as: 'community'
      }
    },
    { $sample: { size: limit } },
    {
      $addFields: {
        commentCount: { $size: '$comments' },
        profilePicture: { $arrayElemAt: ['$community.icon', 0] }
      }
    },
    {
      $project: {
        comments: 0,
        community: 0,
        __v: 0,
        followers: 0,
        upvote: 0,
        downvote: 0,
        views: 0,
        isImage: 0,
        isDeleted: 0,
        mostRecentUpvote: 0,
        actions: 0,
        isRemoved: 0
      }
    }
  ])
}

PostSchema.statics.getSortedHomeFeed = async function (options, communities, mutedCommunities, showAdultContent) {
  const { page, limit, sortMethod, time } = options
  console.log(showAdultContent)

  return await this.aggregate([
    {
      $match: {
        $and: [
          {
            $expr: {
              $cond: {
                if: { $ne: [communities, null] },
                then: { $in: ['$communityName', communities] },
                else: true
              }
            }
          },
          {
            $expr: {
              $cond: {
                if: { $ne: [mutedCommunities, null] },
                then: { $not: { $in: ['$communityName', mutedCommunities] } },
                else: true
              }
            }
          },
          {
            $expr: {
              $cond: {
                if: { $eq: [showAdultContent, false] },
                then: { $eq: ['$isNsfw', false] },
                else: true
              }
            }
          }
        ],
        createdAt: time,
        isDeleted: false,
        isRemoved: false,
        type: { $ne: 'Comment' }
      }
    },
    {
      $lookup: {
        from: 'posts',
        localField: '_id',
        foreignField: 'postID',
        as: 'comments'
      }
    },
    {
      $lookup: {
        from: 'communities',
        localField: 'communityName',
        foreignField: 'name',
        as: 'community'
      }
    },
    { $sort: sortMethod },
    { $skip: page * limit },
    { $limit: limit },
    {
      $addFields: {
        commentCount: { $size: '$comments' },
        profilePicture: { $arrayElemAt: ['$community.icon', 0] }
      }
    },
    {
      $project: {
        comments: 0,
        community: 0,
        __v: 0,
        followers: 0,
        upvote: 0,
        downvote: 0,
        views: 0,
        isImage: 0,
        isDeleted: 0,
        mostRecentUpvote: 0,
        actions: 0,
        isRemoved: 0
      }
    }
  ])
}

PostSchema.statics.getHomeFeed = async function (user, options) {
  const { page, limit, sortMethod, time, random } = options

  console.log(user)

  if (random) {
    return await this.aggregate([
      {
        $match: {
          createdAt: time,
          isDeleted: false,
          isRemoved: false
        }
      },
      {
        $lookup: {
          from: 'posts',
          let: { post_id: '$_id', type: 'Comment' },
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
          localField: 'communityName',
          foreignField: 'name',
          as: 'community'
        }
      },
      {
        $lookup: {
          from: 'users',
          let: { user: user },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$username', '$$user'] }
              }
            }
          ],
          as: 'user'
        }
      },
      { $sample: { size: limit } },
      {
        $addFields: {
          user: { $arrayElemAt: ['$user', 0] }
        }
      },
      {
        $addFields: {
          commentCount: { $size: { $ifNull: ['$comments', []] } },
          icon: { $arrayElemAt: ['$community.icon', 0] },
          isUpvoted: {
            $cond: {
              if: { $ne: ['$user', null] },
              then: { $in: ['_id', '$user.upvotedPosts.postId'] },
              else: false
            }
          },
          isDownvoted: {
            $cond: {
              if: { $ne: ['$user', null] },
              then: { $in: ['_id', '$user.downvotedPosts.postId'] },
              else: false
            }
          },
          isSaved: {
            $cond: {
              if: { $ne: ['$user', null] },
              then: { $in: ['_id', '$user.savedPosts.postId'] },
              else: false
            }
          },
          isHidden: {
            $cond: {
              if: { $ne: ['$user', null] },
              then: { $in: ['_id', '$user.hiddenPosts.postId'] },
              else: false
            }
          },
          isJoined: {
            $cond: {
              if: { $ne: ['$user', null] },
              then: { $in: ['$community.name', '$user.communities'] },
              else: false
            }
          },
          isModerator: {
            $cond: {
              if: { $ne: ['$user', null] },
              then: { $in: ['$community.name', '$user.moderatorInCommunities'] },
              else: false
            }
          },
          'pollOptions.isVoted': {
            $in: ['Camryn50', '$post.pollOptions.voters']
          }
        }
      },
      {
        $project: {
          postID: 1,
          type: 1,
          username: 1,
          communityName: 1,
          icon: { $arrayElemAt: ['$community.icon', 0] },
          title: 1,
          netVote: 1,
          isSpoiler: 1,
          isNSFW: 1,
          isLocked: 1,
          isApproved: 1,
          content: 1,
          pollOptions: {
            $map: {
              input: '$pollOptions',
              as: 'option',
              in: {
                text: '$$option.text',
                votes: { $size: '$$option.voters' },
                isVoted: {
                  $in: ['Camryn50', '$$option.voters']
                }
              }
            }
          },
          createdAt: 1,
          updatedAt: 1,
          isUpvoted: 'isUpvoted',
          isDownvoted: '$isDownvoted',
          isHidden: '$isHidden',
          isSaved: '$isSaved',
          isJoined: '$isJoined',
          isModerator: '$isModerator',
          commentCount: { $ifNull: [{ $arrayElemAt: ['$commentCount.commentCount', 0] }, 0] }
        }
      }
    ])
  } else {
    return await this.aggregate([
      { $match: { createdAt: time, isDeleted: false, isRemoved: false } },
      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: 'postID',
          as: 'comments'
        }
      },
      {
        $lookup: {
          from: 'communities',
          localField: 'communityName',
          foreignField: 'name',
          as: 'community'
        }
      },
      { $sort: sortMethod },
      { $skip: page * limit },
      { $limit: limit },
      // {
      //   $addFields: {
      //     commentCount: { $size: '$comments' },
      //     profilePicture: { $arrayElemAt: ['$community.profilePicture', 0] },
      //     isUpvoted: { $in: ['_id', '$user.upvotedPosts'] },
      //     isDownvoted: { $in: ['_id', '$user.downvotedPosts'] },
      //     isSaved: { $in: ['_id', '$user.savedPosts'] },
      //     isHidden: { $in: ['_id', '$user.hiddenPosts'] },
      //     isJoined: { $in: ['$community.name', '$user.communities'] },
      //     isModerator: { $in: ['$communityName.name', '$user.moderatorInCommunities'] }
      //   }
      // },
      {
        $project: {
          comments: 0,
          user: 0,
          __v: 0,
          followers: 0,
          upvote: 0,
          downvote: 0,
          views: 0,
          isImage: 0,
          isDeleted: 0,
          mostRecentUpvote: 0,
          actions: 0,
          isRemoved: 0
        }
      }
    ])
  }
}

module.exports = mongoose.model('Post', PostSchema)
