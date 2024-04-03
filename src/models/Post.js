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

// PostSchema.methods.getComments = async function (options) {
//   const { random, sort, limit, page } = options
//   const postId = this._id
//   if (random) {
//     return await this.model('Post').aggregate([
//       {
//         $match: { _id: postId }
//       },
//       {
//         $lookup: {
//           from: 'comments',
//           let: { postId: '$_id' },
//           pipeline: [
//             {
//               $match: { postID: postId, isDeleted: false }
//             },
//             {
//               $sample: { size: limit }
//             }
//           ],
//           as: 'comments'
//         }
//       },
//       { $unwind: '$comments' },
//       {
//         $lookup: {
//           from: 'users',
//           localField: 'comments.username',
//           foreignField: 'username',
//           as: 'user'
//         }
//       },
//       { $unwind: '$user' },
//       {
//         $group: {
//           _id: '$_id',
//           post: { $first: '$$ROOT' },
//           comments: {
//             $push: {
//               _id: '$comments._id',
//               postID: '$comments.postID',
//               username: '$comments.username',
//               parentID: '$comments.parentID',
//               communityID: '$comments.communityID',
//               content: '$comments.content',
//               upvote: '$comments.upvote',
//               downvote: '$comments.downvote',
//               netvote: '$comments.netVote',
//               isEdited: '$comments.isEdited',
//               isLocked: '$comments.isLocked',
//               isApproved: '$comments.isApproved',
//               isDeleted: '$comments.isDeleted',
//               profilePicture: '$user.profilePicture',
//               createdAt: '$comments.createdAt'
//             }
//           }
//         }
//       },
//       {
//         $replaceRoot: {
//           newRoot: {
//             $mergeObjects: ['$post', { comments: '$comments' }]
//           }
//         }
//       },
//       {
//         $project: {
//           user: 0
//         }
//       }
//     ]
//     )
//   }

//   return await this.model('Post').aggregate([
//     {
//       $match: { _id: postId }
//     },
//     {
//       $lookup: {
//         from: 'comments',
//         let: { postId: '$_id' },
//         pipeline: [
//           {
//             $match: { postID: postId, isDeleted: false }
//           },
//           {
//             $sort: sort
//           },
//           {
//             $skip: page * limit
//           },
//           {
//             $limit: limit
//           }
//         ],
//         as: 'comments'
//       }
//     },
//     { $unwind: '$comments' },
//     {
//       $lookup: {
//         from: 'users',
//         localField: 'comments.username',
//         foreignField: 'username',
//         as: 'user'
//       }
//     },
//     { $unwind: '$user' },
//     {
//       $group: {
//         _id: '$_id',
//         post: { $first: '$$ROOT' },
//         comments: {
//           $push: {
//             _id: '$comments._id',
//             postID: '$comments.postID',
//             username: '$comments.username',
//             parentID: '$comments.parentID',
//             communityID: '$comments.communityID',
//             content: '$comments.content',
//             upvote: '$comments.upvote',
//             downvote: '$comments.downvote',
//             netvote: '$comments.netVote',
//             isEdited: '$comments.isEdited',
//             isLocked: '$comments.isLocked',
//             isApproved: '$comments.isApproved',
//             isDeleted: '$comments.isDeleted',
//             profilePicture: '$user.profilePicture',
//             createdAt: '$comments.createdAt'
//           }
//         }
//       }
//     },
//     {
//       $replaceRoot: {
//         newRoot: {
//           $mergeObjects: ['$post', { comments: '$comments' }]
//         }
//       }
//     },
//     {
//       $project: {
//         user: 0
//       }
//     }
//   ])
// }

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
        from: 'users',
        localField: 'username',
        foreignField: 'username',
        as: 'user'
      }
    },
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

PostSchema.statics.byCommunity = async function (communityName, options) {
  const { page, limit, sortMethod, time } = options
  return await this.aggregate([
    { $match: { communityName: communityName, createdAt: time, isDeleted: false, isRemoved: false } },
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

module.exports = mongoose.model('Post', PostSchema)
