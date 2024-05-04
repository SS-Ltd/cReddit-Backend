const mongoose = require('mongoose')
const Schema = mongoose.Schema

const PostSchema = new Schema({
  type: {
    type: String,
    required: true,
    enum: ['Post', 'Images & Video', 'Link', 'Poll', 'Comment', 'Cross Post']
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
  reports: [{
    user: {
      type: String,
      ref: 'User',
      refPath: 'username'
    },
    rule: {
      type: String
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
  const { random, sort, limit, page, username, blockedUsers, isModerator } = options
  if (random) {
    return await this.aggregate([
      {
        $match: {
          postID: postId,
          type: 'Comment',
          isDeleted: false,
          isRemoved: false
        }
      },
      {
        $lookup: {
          from: 'posts',
          localField: 'postID',
          foreignField: '_id',
          as: 'posts'
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
      {
        $lookup: {
          from: 'reports',
          let: { postId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$post', '$$postId'] },
                isDeleted: false
              }
            },
            {
              $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: 'username',
                as: 'user'
              }
            },
            {
              $addFields: {
                username: { $arrayElemAt: ['$user.username', 0] },
                profilePicture: { $arrayElemAt: ['$user.profilePicture', 0] }
              }
            },
            {
              $project: {
                user: 0,
                __v: 0,
                isDeleted: 0,
                type: 0,
                message: 0,
                post: 0
              }
            }
          ],
          as: 'reports'
        }
      },
      { $sample: { size: limit } },
      {
        $match: {
          $expr: {
            $cond: {
              if: { $and: [{ $ne: [username, null] }, { $eq: [isModerator, null] }, { $ne: [{ $arrayElemAt: ['$posts.username', 0] }, username] }] },
              then: { $and: [{ $not: { $in: [username, { $arrayElemAt: ['$user.blockedUsers', 0] }] } }, { $not: { $in: ['$username', blockedUsers] } }] },
              else: true
            }
          }
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
          isNsfw: 0,
          posts: 0
        }
      }
    ])
  }

  return await this.aggregate([
    { $match: { postID: postId, type: 'Comment', isDeleted: false, isRemoved: false } },
    {
      $lookup: {
        from: 'posts',
        localField: 'postID',
        foreignField: '_id',
        as: 'posts'
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
    {
      $lookup: {
        from: 'reports',
        let: { postId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$post', '$$postId'] },
              isDeleted: false
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: 'user',
              foreignField: 'username',
              as: 'user'
            }
          },
          {
            $addFields: {
              username: { $arrayElemAt: ['$user.username', 0] },
              profilePicture: { $arrayElemAt: ['$user.profilePicture', 0] }
            }
          },
          {
            $project: {
              user: 0,
              __v: 0,
              isDeleted: 0,
              type: 0,
              message: 0,
              post: 0
            }
          }
        ],
        as: 'reports'
      }
    },
    { $sort: sort },
    { $skip: page * limit },
    { $limit: limit },
    {
      $match: {
        $expr: {
          $cond: {
            if: { $and: [{ $ne: [username, null] }, { $eq: [isModerator, null] }, { $ne: [{ $arrayElemAt: ['$posts.username', 0] }, username] }] },
            then: { $and: [{ $not: { $in: [username, { $arrayElemAt: ['$user.blockedUsers', 0] }] } }, { $not: { $in: ['$username', blockedUsers] } }] },
            else: true
          }
        }
      }
    },
    {
      $addFields: {
        profilePicture: { $arrayElemAt: ['$user.profilePicture', 0] },
        reports: '$reports'
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
        isNsfw: 0,
        posts: 0
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
        let: { id: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$postID', '$$id']
              },
              isDeleted: false,
              isRemoved: false
            }
          }
        ],
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
        from: 'posts',
        let: { childId: { $ifNull: ['$child', null] } },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: [
                  '$_id',
                  '$$childId'
                ]
              }
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
              from: 'posts',
              let: { id: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ['$postID', '$$id']
                    },
                    isDeleted: false,
                    isRemoved: false
                  }
                }
              ],
              as: 'comments'
            }
          },
          {
            $addFields: {
              profilePicture: {
                $cond: {
                  if: { $eq: ['$communityName', null] },
                  then: { $arrayElemAt: ['$user.profilePicture', 0] },
                  else: { $arrayElemAt: ['$community.icon', 0] }
                }
              },
              commentCount: { $size: '$comments' }
            }
          },
          {
            $project: {
              community: 0,
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
              comments: 0
            }
          }
        ],
        as: 'child'
      }
    },
    {
      $lookup: {
        from: 'reports',
        let: { postId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$post', '$$postId'] },
              isDeleted: false
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: 'user',
              foreignField: 'username',
              as: 'user'
            }
          },
          {
            $addFields: {
              username: { $arrayElemAt: ['$user.username', 0] },
              profilePicture: { $arrayElemAt: ['$user.profilePicture', 0] }
            }
          },
          {
            $project: {
              user: 0,
              __v: 0,
              isDeleted: 0,
              type: 0,
              message: 0,
              post: 0
            }
          }
        ],
        as: 'reports'
      }
    },
    {
      $addFields: {
        profilePicture: {
          $cond: {
            if: { $eq: ['$communityName', null] },
            then: { $arrayElemAt: ['$user.profilePicture', 0] },
            else: { $arrayElemAt: ['$community.icon', 0] }
          }
        },
        commentCount: { $size: '$comments' },
        reports: '$reports',
        child: { $arrayElemAt: ['$child', 0] },
        creatorBlockedUsers: { $arrayElemAt: ['$user.blockedUsers', 0] },
        isDeletedUser: { $arrayElemAt: ['$user.isDeleted', 0] },
        commentSort: {
          $cond: {
            if: { $eq: ['$communityName', null] },
            then: 'best',
            else: { $arrayElemAt: ['$community.settings.suggestedSort', 0] }
          }
        }
      }
    },
    {
      $project: {
        comments: 0,
        community: 0,
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
        reportUser: 0
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
      $lookup: {
        from: 'reports',
        let: { postId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$post', '$$postId'] },
              isDeleted: false
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: 'user',
              foreignField: 'username',
              as: 'user'
            }
          },
          {
            $addFields: {
              username: { $arrayElemAt: ['$user.username', 0] },
              profilePicture: { $arrayElemAt: ['$user.profilePicture', 0] }
            }
          },
          {
            $project: {
              user: 0,
              __v: 0,
              isDeleted: 0,
              type: 0,
              message: 0,
              post: 0
            }
          }
        ],
        as: 'reports'
      }
    },
    {
      $addFields: {
        profilePicture: { $arrayElemAt: ['$user.profilePicture', 0] },
        reports: '$reports',
        creatorBlockedUsers: { $arrayElemAt: ['$user.blockedUsers', 0] }
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
  const { page, limit, sortMethod, time, username, blockedUsers, isModerator } = options
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
        },
        type: { $ne: 'Comment' }
      }
    },
    {
      $lookup: {
        from: 'posts',
        let: { id: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$postID', '$$id']
              },
              isDeleted: false,
              isRemoved: false
            }
          }
        ],
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
    {
      $lookup: {
        from: 'posts',
        let: { childId: { $ifNull: ['$child', null] } },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: [
                  '$_id',
                  '$$childId'
                ]
              }
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
              from: 'posts',
              let: { id: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ['$postID', '$$id']
                    },
                    isDeleted: false,
                    isRemoved: false
                  }
                }
              ],
              as: 'comments'
            }
          },
          {
            $addFields: {
              profilePicture: {
                $cond: {
                  if: { $eq: ['$communityName', null] },
                  then: { $arrayElemAt: ['$user.profilePicture', 0] },
                  else: { $arrayElemAt: ['$community.icon', 0] }
                }
              },
              commentCount: { $size: '$comments' }
            }
          },
          {
            $project: {
              community: 0,
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
              comments: 0
            }
          }
        ],
        as: 'child'
      }
    },
    {
      $lookup: {
        from: 'reports',
        let: { postId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$post', '$$postId'] },
              isDeleted: false
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: 'user',
              foreignField: 'username',
              as: 'user'
            }
          },
          {
            $addFields: {
              username: { $arrayElemAt: ['$user.username', 0] },
              profilePicture: { $arrayElemAt: ['$user.profilePicture', 0] }
            }
          },
          {
            $project: {
              user: 0,
              __v: 0,
              isDeleted: 0,
              type: 0,
              message: 0,
              post: 0
            }
          }
        ],
        as: 'reports'
      }
    },
    { $sort: sortMethod },
    { $skip: page * limit },
    { $limit: limit },
    {
      $match: {
        $expr: {
          $cond: {
            if: { $and: [{ $ne: [username, null] }, { $eq: [isModerator, null] }] },
            then: { $and: [{ $not: { $in: [username, { $arrayElemAt: ['$user.blockedUsers', 0] }] } }, { $not: { $in: ['$username', blockedUsers] } }] },
            else: true
          }
        }
      }
    },
    {
      $addFields: {
        commentCount: { $size: '$comments' },
        profilePicture: { $arrayElemAt: ['$user.profilePicture', 0] },
        reports: '$reports',
        child: { $arrayElemAt: ['$child', 0] },
        isDeletedUser: { $arrayElemAt: ['$user.isDeleted', 0] }
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

PostSchema.statics.getRandomHomeFeed = async function (options, communities, mutedCommunities, showAdultContent) {
  const { limit, username, blockedUsers, moderatedCommunities } = options

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
        type: { $ne: 'Comment' }
      }
    },
    {
      $lookup: {
        from: 'communities',
        let: { name: '$communityName' },
        pipeline: [
          {
            $match: {
              $and: [
                {
                  $expr: {
                    $eq: ['$name', '$$name']
                  }
                },
                {
                  $expr: {
                    $cond: {
                      if: { $ne: ['$type', 'public'] },
                      then: { $in: ['$name', communities] },
                      else: true
                    }
                  }
                }
              ]
            }
          }
        ],
        as: 'community'
      }
    },
    {
      $lookup: {
        from: 'posts',
        let: { id: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$postID', '$$id']
              },
              isDeleted: false,
              isRemoved: false
            }
          }
        ],
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
    {
      $lookup: {
        from: 'posts',
        let: { childId: { $ifNull: ['$child', null] } },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: [
                  '$_id',
                  '$$childId'
                ]
              }
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
              from: 'posts',
              let: { id: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ['$postID', '$$id']
                    },
                    isDeleted: false,
                    isRemoved: false
                  }
                }
              ],
              as: 'comments'
            }
          },
          {
            $addFields: {
              profilePicture: {
                $cond: {
                  if: { $eq: ['$communityName', null] },
                  then: { $arrayElemAt: ['$user.profilePicture', 0] },
                  else: { $arrayElemAt: ['$community.icon', 0] }
                }
              },
              commentCount: { $size: '$comments' }
            }
          },
          {
            $project: {
              community: 0,
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
              comments: 0
            }
          }
        ],
        as: 'child'
      }
    },
    { $sample: { size: limit } },
    {
      $match: {
        $and: [
          {
            $expr: {
              $cond: {
                if: { $and: [{ $ne: [username, null] }, { $not: { $in: ['$communityName', moderatedCommunities] } }] },
                then: { $and: [{ $not: { $in: [username, { $arrayElemAt: ['$user.blockedUsers', 0] }] } }, { $not: { $in: ['$username', blockedUsers] } }] },
                else: true
              }
            }
          },
          {
            $expr: {
              $cond: {
                if: { $eq: ['$communityName', null] },
                then: { $eq: [{ $arrayElemAt: ['$user.isDeleted', 0] }, false] },
                else: { $eq: [{ $arrayElemAt: ['$community.isDeleted', 0] }, false] }
              }
            }
          }
        ]
      }
    },
    {
      $addFields: {
        profilePicture: {
          $cond: {
            if: { $eq: ['$communityName', null] },
            then: { $arrayElemAt: ['$user.profilePicture', 0] },
            else: { $arrayElemAt: ['$community.icon', 0] }
          }
        },
        commentCount: { $size: '$comments' },
        child: { $arrayElemAt: ['$child', 0] },
        isDeletedUser: { $arrayElemAt: ['$user.isDeleted', 0] }
      }
    },
    {
      $project: {
        comments: 0,
        community: 0,
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

PostSchema.statics.getPopular = async function (options, mutedCommunities, showAdultContent) {
  const { limit, username, blockedUsers, moderatedCommunities } = options

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
            },
            type: 'Images & Video'
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
        type: { $ne: 'Comment' }
      }
    },
    {
      $lookup: {
        from: 'posts',
        let: { id: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$postID', '$$id']
              },
              isDeleted: false,
              isRemoved: false
            }
          }
        ],
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
        from: 'posts',
        let: { childId: { $ifNull: ['$child', null] } },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: [
                  '$_id',
                  '$$childId'
                ]
              }
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
              from: 'posts',
              let: { id: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ['$postID', '$$id']
                    },
                    isDeleted: false,
                    isRemoved: false
                  }
                }
              ],
              as: 'comments'
            }
          },
          {
            $addFields: {
              profilePicture: {
                $cond: {
                  if: { $eq: ['$communityName', null] },
                  then: { $arrayElemAt: ['$user.profilePicture', 0] },
                  else: { $arrayElemAt: ['$community.icon', 0] }
                }
              },
              commentCount: { $size: '$comments' }
            }
          },
          {
            $project: {
              community: 0,
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
              comments: 0
            }
          }
        ],
        as: 'child'
      }
    },
    { $sample: { size: limit } },
    {
      $match: {
        $and: [
          {
            $expr: {
              $cond: {
                if: { $and: [{ $ne: [username, null] }, { $not: { $in: ['$communityName', moderatedCommunities] } }] },
                then: { $and: [{ $not: { $in: [username, { $arrayElemAt: ['$user.blockedUsers', 0] }] } }, { $not: { $in: ['$username', blockedUsers] } }] },
                else: true
              }
            }
          },
          {
            $expr: {
              $cond: {
                if: { $eq: ['$communityName', null] },
                then: { $eq: [{ $arrayElemAt: ['$user.isDeleted', 0] }, false] },
                else: { $eq: [{ $arrayElemAt: ['$community.isDeleted', 0] }, false] }
              }
            }
          }
        ]
      }
    },
    {
      $addFields: {
        profilePicture: {
          $cond: {
            if: { $eq: ['$communityName', null] },
            then: { $arrayElemAt: ['$user.profilePicture', 0] },
            else: { $arrayElemAt: ['$community.icon', 0] }
          }
        },
        commentCount: { $size: '$comments' },
        child: { $arrayElemAt: ['$child', 0] },
        isDeletedUser: { $arrayElemAt: ['$user.isDeleted', 0] }
      }
    },
    {
      $project: {
        comments: 0,
        community: 0,
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

PostSchema.statics.getSortedHomeFeed = async function (options, communities, mutedCommunities, follows, showAdultContent) {
  const { page, limit, sortMethod, time, username, blockedUsers, moderatedCommunities } = options

  return await this.aggregate([
    {
      $match: {
        $and: [
          {
            $or: [
              {
                $expr: {
                  $cond: {
                    if: { $ne: [follows, null] },
                    then: { $and: [{ $in: ['$username', follows] }, { $eq: ['$communityName', null] }] },
                    else: false
                  }
                }
              },
              {
                communityName: { $in: communities }
              }
            ]
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
        let: { id: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$postID', '$$id']
              },
              isDeleted: false,
              isRemoved: false
            }
          }
        ],
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
        from: 'posts',
        let: { childId: { $ifNull: ['$child', null] } },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: [
                  '$_id',
                  '$$childId'
                ]
              }
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
              from: 'posts',
              let: { id: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ['$postID', '$$id']
                    },
                    isDeleted: false,
                    isRemoved: false
                  }
                }
              ],
              as: 'comments'
            }
          },
          {
            $addFields: {
              profilePicture: {
                $cond: {
                  if: { $eq: ['$communityName', null] },
                  then: { $arrayElemAt: ['$user.profilePicture', 0] },
                  else: { $arrayElemAt: ['$community.icon', 0] }
                }
              },
              commentCount: { $size: '$comments' }
            }
          },
          {
            $project: {
              community: 0,
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
              comments: 0
            }
          }
        ],
        as: 'child'
      }
    },
    { $sort: sortMethod },
    { $skip: page * limit },
    { $limit: limit },
    {
      $match: {
        $and: [
          {
            $expr: {
              $cond: {
                if: { $and: [{ $ne: [username, null] }, { $not: { $in: ['$communityName', moderatedCommunities] } }] },
                then: { $and: [{ $not: { $in: [username, { $arrayElemAt: ['$user.blockedUsers', 0] }] } }, { $not: { $in: ['$username', blockedUsers] } }] },
                else: true
              }
            }
          },
          {
            $expr: {
              $cond: {
                if: { $eq: ['$communityName', null] },
                then: { $eq: [{ $arrayElemAt: ['$user.isDeleted', 0] }, false] },
                else: { $eq: [{ $arrayElemAt: ['$community.isDeleted', 0] }, false] }
              }
            }
          }
        ]
      }
    },
    {
      $addFields: {
        profilePicture: {
          $cond: {
            if: { $eq: ['$communityName', null] },
            then: { $arrayElemAt: ['$user.profilePicture', 0] },
            else: { $arrayElemAt: ['$community.icon', 0] }
          }
        },
        commentCount: { $size: '$comments' },
        child: { $arrayElemAt: ['$child', 0] },
        isDeletedUser: { $arrayElemAt: ['$user.isDeleted', 0] }
      }
    },
    {
      $project: {
        comments: 0,
        community: 0,
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

PostSchema.statics.getHomeFeed = async function (user, options) {
  const { page, limit, sortMethod, time, random } = options

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

PostSchema.statics.getReportedPosts = async function (communityName, options) {
  const { page, limit, sortMethod, type } = options
  return await this.aggregate([
    {
      $match: {
        communityName: communityName,
        isDeleted: false,
        isRemoved: false,
        isApproved: false,
        $expr: {
          $cond: {
            if: { $eq: [type, 'Comment'] },
            then: { $eq: ['$type', 'Comment'] },
            else: {
              $cond: {
                if: { $eq: [type, 'Post'] },
                then: { $ne: ['$type', 'Comment'] },
                else: true
              }
            }
          }
        }
      }
    },
    {
      $lookup: {
        from: 'reports',
        let: { postId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$post', '$$postId'] },
              isDeleted: false
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: 'user',
              foreignField: 'username',
              as: 'user'
            }
          },
          {
            $addFields: {
              username: { $arrayElemAt: ['$user.username', 0] }
            }
          },
          {
            $project: {
              user: 0,
              __v: 0,
              isDeleted: 0,
              type: 0,
              message: 0,
              post: 0
            }
          }
        ],
        as: 'reports'
      }
    },
    {
      $match: {
        $expr: {
          $cond: {
            if: { $gt: [{ $size: '$reports' }, 0] },
            then: true,
            else: false
          }
        }
      }
    },
    {
      $lookup: {
        from: 'posts',
        let: { childId: { $ifNull: ['$child', null] } },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: [
                  '$_id',
                  '$$childId'
                ]
              }
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
              from: 'posts',
              let: { id: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ['$postID', '$$id']
                    },
                    isDeleted: false,
                    isRemoved: false
                  }
                }
              ],
              as: 'comments'
            }
          },
          {
            $addFields: {
              profilePicture: {
                $cond: {
                  if: { $eq: ['$communityName', null] },
                  then: { $arrayElemAt: ['$user.profilePicture', 0] },
                  else: { $arrayElemAt: ['$community.icon', 0] }
                }
              },
              commentCount: { $size: '$comments' }
            }
          },
          {
            $project: {
              community: 0,
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
              comments: 0
            }
          }
        ],
        as: 'child'
      }
    },
    {
      $lookup: {
        from: 'posts',
        let: { id: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$postID', '$$id']
              },
              isDeleted: false,
              isRemoved: false
            }
          }
        ],
        as: 'comments'
      }
    },
    {
      $lookup: {
        from: 'posts',
        let: { postId: { $ifNull: ['$postID', null] } },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', '$$postId']
              }
            }
          },
          {
            $project: {
              title: 1
            }
          }
        ],
        as: 'postTitle'
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
        icon: { $arrayElemAt: ['$community.icon', 0] },
        reports: '$reports',
        postTitle: { $arrayElemAt: ['$postTitle.title', 0] },
        child: { $arrayElemAt: ['$child', 0] }
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
        isDeleted: 0,
        mostRecentUpvote: 0
      }
    }
  ])
}

PostSchema.statics.searchPosts = async function (options) {
  const { page, limit, query, safeSearch, community, user, sortMethod, filter } = options
  return await this.aggregate([
    {
      $search: {
        index: 'postSearchIndex',
        text: {
          query: query,
          path: ['title', 'content'],
          fuzzy: {}
        }
      }
    },
    {
      $match: {
        isDeleted: false,
        isRemoved: false,
        type: { $ne: 'Comment' },
        createdAt: filter,
        ...(community ? { communityName: community } : {}),
        ...(user ? { username: user } : {}),
        ...(safeSearch ? { isNsfw: false } : {})
      }
    },
    {
      $sort: { score: { $meta: 'textScore' }, ...sortMethod }
    },
    {
      $skip: (page - 1) * limit
    },
    {
      $limit: limit
    },
    {
      $lookup: {
        from: 'posts',
        let: { id: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$postID', '$$id']
              },
              isDeleted: false,
              isRemoved: false
            }
          }
        ],
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
      $lookup: {
        from: 'users',
        localField: 'username',
        foreignField: 'username',
        as: 'user'
      }
    },
    {
      $addFields: {
        commentCount: { $size: '$comments' },
        profilePicture: {
          $cond: {
            if: { $eq: ['$communityName', null] },
            then: { $arrayElemAt: ['$user.profilePicture', 0] },
            else: { $arrayElemAt: ['$community.icon', 0] }
          }
        }
      }
    },
    {
      $project: {
        _id: 1,
        type: 1,
        title: 1,
        username: 1,
        profilePicture: 1,
        communityName: 1,
        createdAt: 1,
        netVote: 1,
        commentCount: 1,
        content: 1,
        isNsfw: 1,
        isSpoiler: 1
      }
    }
  ])
}

PostSchema.statics.searchComments = async function (options) {
  const { page, limit, query, safeSearch, community, user, sortMethod } = options
  return await this.aggregate([
    {
      $search: {
        index: 'postSearchIndex',
        text: {
          query: query,
          path: 'content',
          fuzzy: {}
        }
      }
    },
    {
      $match: {
        isDeleted: false,
        isRemoved: false,
        isImage: false,
        type: { $eq: 'Comment' },
        ...(community ? { communityName: community } : {}),
        ...(user ? { username: user } : {}),
        ...(safeSearch ? { isNsfw: false } : {})
      }
    },
    {
      $sort: { score: { $meta: 'textScore' }, ...sortMethod }
    },
    {
      $skip: (page - 1) * limit
    },
    {
      $limit: limit
    },
    {
      $lookup: {
        from: 'posts',
        localField: 'postID',
        foreignField: '_id',
        as: 'post'
      }
    },
    {
      $lookup: {
        from: 'posts',
        let: { id: '$post._id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$postID', '$$id']
              },
              type: 'Comment',
              isDeleted: false,
              isRemoved: false
            }
          }
        ],
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
      $lookup: {
        from: 'users',
        localField: 'username',
        foreignField: 'username',
        as: 'user'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'post.username',
        foreignField: 'username',
        as: 'postUser'
      }
    },
    {
      $addFields: {
        postPicture: {
          $cond: {
            if: { $eq: ['$communityName', null] },
            then: { $arrayElemAt: ['$postUser.profilePicture', 0] },
            else: { $arrayElemAt: ['$community.icon', 0] }
          }
        },
        postUsername: { $arrayElemAt: ['$postUser.username', 0] },
        commentPicture: { $arrayElemAt: ['$user.profilePicture', 0] },
        commentCount: { $size: '$comments' },
        postVotes: { $arrayElemAt: ['$post.netVote', 0] },
        postCreatedAt: { $arrayElemAt: ['$post.createdAt', 0] },
        postTitle: { $arrayElemAt: ['$post.title', 0] },
        isPostSpoiler: { $arrayElemAt: ['$post.isSpoiler', 0] },
        isPostNsfw: { $arrayElemAt: ['$post.isNsfw', 0] }
      }
    },
    {
      $project: {
        _id: 1,
        postID: 1,
        postTitle: 1,
        postUsername: 1,
        postVotes: 1,
        postPicture: 1,
        postCreatedAt: 1,
        isPostNsfw: 1,
        isPostSpoiler: 1,
        communityName: 1,
        createdAt: 1,
        username: 1,
        netVote: 1,
        commentCount: 1,
        commentPicture: 1,
        content: 1
      }
    }
  ])
}

PostSchema.statics.searchHashtags = async function (options) {
  const { page, limit, query, safeSearch, community, user, sortMethod } = options
  return await this.aggregate([
    {
      $search: {
        index: 'postSearchIndex',
        autocomplete: {
          query: '#' + query,
          path: 'content',
          tokenOrder: 'sequential'
        }
      }
    },
    {
      $match: {
        isDeleted: false,
        isRemoved: false,
        isImage: false,
        ...(community ? { communityName: community } : {}),
        ...(user ? { username: user } : {}),
        ...(safeSearch ? { isNsfw: false } : {})
      }
    },
    {
      $sort: { score: { $meta: 'textScore' }, ...sortMethod }
    },
    {
      $skip: (page - 1) * limit
    },
    {
      $limit: limit
    },
    {
      $lookup: {
        from: 'posts',
        localField: 'postID',
        foreignField: '_id',
        as: 'post'
      }
    },
    {
      $lookup: {
        from: 'posts',
        let: { id: '$post._id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$postID', '$$id']
              },
              type: 'Comment',
              isDeleted: false,
              isRemoved: false
            }
          }
        ],
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
      $lookup: {
        from: 'users',
        localField: 'username',
        foreignField: 'username',
        as: 'user'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'post.username',
        foreignField: 'username',
        as: 'postUser'
      }
    },
    {
      $addFields: {
        postPicture: {
          $cond: {
            if: { $eq: ['$communityName', null] },
            then: { $arrayElemAt: ['$postUser.profilePicture', 0] },
            else: { $arrayElemAt: ['$community.icon', 0] }
          }
        },
        postUsername: { $arrayElemAt: ['$postUser.username', 0] },
        commentPicture: { $arrayElemAt: ['$user.profilePicture', 0] },
        commentCount: { $size: '$comments' },
        postVotes: { $arrayElemAt: ['$post.netVote', 0] },
        postCreatedAt: { $arrayElemAt: ['$post.createdAt', 0] },
        postTitle: {
          $cond: {
            if: { $eq: ['$type', 'Comment'] },
            then: { $arrayElemAt: ['$post.title', 0] },
            else: '$title'
          }
        },
        isPostSpoiler: { $arrayElemAt: ['$post.isSpoiler', 0] },
        isPostNsfw: { $arrayElemAt: ['$post.isNsfw', 0] }
      }
    },
    {
      $project: {
        _id: 1,
        type: 1,
        postID: 1,
        postTitle: 1,
        postUsername: 1,
        postVotes: 1,
        postPicture: 1,
        postCreatedAt: 1,
        isPostNsfw: 1,
        isPostSpoiler: 1,
        communityName: 1,
        createdAt: 1,
        username: 1,
        netVote: 1,
        commentCount: 1,
        commentPicture: 1,
        content: 1
      }
    }
  ])
}

module.exports = mongoose.model('Post', PostSchema)
