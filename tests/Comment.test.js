const PostModel = require('../src/models/Post')
const UserModel = require('../src/models/User')
const HistoryModel = require('../src/models/History')
const { getComment } = require('../src/controllers/Comment')
const comment = require('../src/controllers/Comment')
const MediaUtils = require('../src/utils/Media')
const Community = require('../src/models/Community')

jest.mock('../src/models/Post', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getComment: jest.fn(),
      getPost: jest.fn(),
      save: jest.fn(),
      deleteOne: jest.fn()
    }
  })
})

jest.mock('../src/models/User', () => {
  return {
    findOne: jest.fn()
  }
})

jest.mock('../src/models/History', () => {
  return {
    findOne: jest.fn()
  }
})

describe('getComment', () => {
  test('should retrieve a comment with a valid commentId', async () => {
    const req = {
      params: {
        commentId: '2972dbbf638edddc2eea00ab'
      },
      decoded: {
        username: 'testUser'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const comment = {
      _id: '2972dbbf638edddc2eea00ab',
      postID: '8208ebbb65d8488cfcc0a686',
      profilePicture: 'profilePictureUrl'
    }

    const post = {
      isNsfw: false
    }

    const user = {
      upvotedPosts: [{ postId: '2972dbbf638edddc2eea00ab' }],
      downvotedPosts: [],
      savedPosts: [],
      preferences: {
        showAdultContent: false
      },
      moderatorInCommunities: [],
      blockedUsers: []
    }

    const history = {
      owner: 'testUser',
      post: '8208ebbb65d8488cfcc0a686',
      save: jest.fn()
    }

    UserModel.findOne.mockResolvedValue(user)
    PostModel.getComment = jest.fn().mockResolvedValue([comment])
    PostModel.getPost = jest.fn().mockResolvedValue([post])
    HistoryModel.findOne.mockResolvedValue(history)

    await getComment(req, res)

    expect(PostModel.getComment).toHaveBeenCalled()
    expect(PostModel.getPost).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      _id: '2972dbbf638edddc2eea00ab',
      isUpvoted: true,
      isDownvoted: false,
      isSaved: false,
      profilePicture: 'profilePictureUrl',
      postID: '8208ebbb65d8488cfcc0a686',
      isModerator: false,
      isBlocked: false
    })
  })

  test('should return a 400 status code and a message "Comment ID is wrong" if the commentId is not valid', async () => {
    const req = ({
      params: { commentId: 'invalidId' }
    })

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    await getComment(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Comment ID is wrong' })
  })

  test('should return a 404 status code and a message "Comment does not exist" if the comment does not exist', async () => {
    const req = ({
      params: { commentId: '2972dbbf638edddc2eea00ab' }
    })

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    PostModel.getComment.mockResolvedValue([])

    await getComment(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ message: 'Comment does not exist' })
  })

  test('should return a 404 status code and a message "Post does not exist" if the post does not exist', async () => {
    const req = ({
      params: { commentId: '2972dbbf638edddc2eea00ab' }
    })

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const comment = {
      _id: '2972dbbf638edddc2eea00ab',
      postID: '8208ebbb65d8488cfcc0a686'
    }

    PostModel.getComment.mockResolvedValue([comment])
    PostModel.getPost.mockResolvedValue([])

    await getComment(req, res)

    expect(PostModel.getComment).toHaveBeenCalled()
    expect(PostModel.getPost).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ message: 'Post does not exist' })
  })

  test('should return a 404 status code and a message "User does not exist" if the user does not exist', async () => {
    const req = ({
      params: { commentId: '2972dbbf638edddc2eea00ab' },
      decoded: { username: 'testUser' }
    })

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const comment = {
      _id: '2972dbbf638edddc2eea00ab',
      postID: '8208ebbb65d8488cfcc0a686'
    }

    const post = {
      isNsfw: false
    }

    PostModel.getComment.mockResolvedValue([comment])
    PostModel.getPost.mockResolvedValue([post])
    UserModel.findOne.mockResolvedValue(null)

    await getComment(req, res)

    expect(PostModel.getComment).toHaveBeenCalled()
    expect(PostModel.getPost).toHaveBeenCalled()
    expect(UserModel.findOne).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ message: 'User does not exist' })
  })

  test('should return a 401 status code and a message "Unable to view NSFW content" if the user does not want to see NSFW posts', async () => {
    const req = ({
      params: { commentId: '2972dbbf638edddc2eea00ab' },
      decoded: { username: 'testUser' }
    })

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const comment = {
      _id: '2972dbbf638edddc2eea00ab',
      postID: '8208ebbb65d8488cfcc0a686',
      communityName: 'testCommunity',
      creatorBlockedUsers: []
    }

    const post = {
      isNsfw: true,
      username: 'testUser'
    }

    const user = {
      upvotedPosts: [],
      downvotedPosts: [],
      savedPosts: [],
      preferences: {
        showAdultContent: false
      },
      blockedUsers: [],
      moderatorInCommunities: []
    }

    PostModel.getComment.mockResolvedValue([comment])
    PostModel.getPost.mockResolvedValue([post])
    UserModel.findOne.mockResolvedValue(user)

    await getComment(req, res)

    expect(PostModel.getComment).toHaveBeenCalled()
    expect(PostModel.getPost).toHaveBeenCalled()
    expect(UserModel.findOne).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ message: 'Unable to view NSFW content' })
  })
})

describe('createComment', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should create a comment with text content', async () => {
    const req = {
      decoded: { username: 'Test User' },
      body: {
        postId: '660d7e17baa5c72965311c7f',
        content: 'Test Comment'
      },
      files: []
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      settings: {
        allowImageComments: false
      }
    }

    UserModel.findOne = jest.fn().mockResolvedValue({ username: 'Test User', preferences: { commentsNotifs: false }, upvotedPosts: [], downvotedPosts: [], save: jest.fn() })
    PostModel.findOne = jest.fn().mockResolvedValue({ type: 'Post', name: 'Test Post', communityName: 'Test Community' })
    Community.findOne = jest.fn().mockResolvedValue(community)

    await comment.createComment(req, res)

    expect(PostModel).toHaveBeenCalledWith({
      type: 'Comment',
      username: 'Test User',
      communityName: 'Test Community',
      content: 'Test Comment',
      postID: '660d7e17baa5c72965311c7f',
      isImage: false,
      upvotedPosts: [],
      downvotedPosts: []
    })
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith({ message: 'Comment created successfully' })
  })

  test('should create a comment with image content', async () => {
    const req = {
      decoded: { username: 'Test User' },
      body: {
        postId: '660d7e17baa5c72965311c7f'
      },
      files: [{ buffer: Buffer.from('file1') }]
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      settings: {
        allowImageComments: true
      }
    }

    UserModel.findOne = jest.fn().mockResolvedValue({ username: 'Test User', preferences: { commentsNotifs: false }, upvotedPosts: [], downvotedPosts: [], save: jest.fn() })
    PostModel.findOne = jest.fn().mockResolvedValue({ type: 'Post', name: 'Test Post', communityName: 'Test Community' })
    Community.findOne = jest.fn().mockResolvedValue(community)

    MediaUtils.cloudinary.uploader.upload = jest.fn().mockResolvedValue({ secure_url: 'secure_url' })

    await comment.createComment(req, res)

    expect(PostModel).toHaveBeenCalledWith({
      type: 'Comment',
      username: 'Test User',
      communityName: 'Test Community',
      content: 'secure_url',
      postID: '660d7e17baa5c72965311c7f',
      isImage: true,
      upvotedPosts: [],
      downvotedPosts: []
    })
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith({ message: 'Comment created successfully' })
  })

  test('should not create a comment with text & image content', async () => {
    const req = {
      decoded: { username: 'Test User' },
      body: {
        postId: '660d7e17baa5c72965311c7f',
        content: 'Test Comment'
      },
      files: [{ buffer: Buffer.from('file1') }]
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    PostModel.findOne = jest.fn().mockResolvedValue({ type: 'Post', name: 'Test Post', communityName: 'Test Community' })

    MediaUtils.cloudinary.uploader.upload = jest.fn().mockResolvedValue({ secure_url: 'secure_url' })

    await comment.createComment(req, res)

    expect(PostModel).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Comment cannot have content & image at the same time' })
  })

  test('should not create a comment with missing content', async () => {
    const req = {
      decoded: { username: 'Test User' },
      body: {
        postId: '660d7e17baa5c72965311c7f'
      },
      files: []
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    await comment.createComment(req, res)

    expect(PostModel).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Comment must have content or image' })
  })

  test('should not create a comment with more than 1 image', async () => {
    const req = {
      decoded: { username: 'Test User' },
      body: {
        postId: '660d7e17baa5c72965311c7f'
      },
      files: [{ buffer: Buffer.from('file1') },
        { buffer: Buffer.from('file2') },
        { buffer: Buffer.from('file3') },
        { buffer: Buffer.from('file4') },
        { buffer: Buffer.from('file5') }]
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    await comment.createComment(req, res)

    expect(PostModel).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Comment can only have one image' })
  })

  test('should not create a comment for a non-existing post (null)', async () => {
    const req = {
      decoded: { username: 'Test User' },
      body: {
        postId: '660d7e17baa5c72965311c7f'
      },
      files: [{ buffer: Buffer.from('file1') }]
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    PostModel.findOne = jest.fn().mockResolvedValue(null)

    await comment.createComment(req, res)

    expect(PostModel).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Cannot comment on a non-existing post' })
  })

  test('should not create a comment for a non-existing post (comment)', async () => {
    const req = {
      decoded: { username: 'Test User' },
      body: {
        postId: '660d7e17baa5c72965311c7f'
      },
      files: [{ buffer: Buffer.from('file1') }]
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    PostModel.findOne = jest.fn().mockResolvedValue({ type: 'Comment', name: 'Test Comment', communityName: 'Test Community' })

    await comment.createComment(req, res)

    expect(PostModel).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Cannot comment on a non-existing post' })
  })
})

describe('editComment', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should edit an existing comment with text content when valid commentId and content are provided', async () => {
    const req = {
      params: {
        commentId: '660d7e17baa5c72965311c7f'
      },
      body: {
        content: 'new comment content'
      },
      decoded: {
        username: 'authorizedUser'
      },
      files: []
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    PostModel.findOne = jest.fn().mockResolvedValue({
      _id: 'validCommentId',
      type: 'Comment',
      username: 'authorizedUser',
      isImage: false,
      save: jest.fn()
    })
    MediaUtils.deleteImages = jest.fn().mockResolvedValue()
    MediaUtils.uploadImages = jest.fn().mockResolvedValue([])

    await comment.editComment(req, res)

    expect(PostModel.findOne).toHaveBeenCalledWith({ _id: '660d7e17baa5c72965311c7f' })
    expect(MediaUtils.deleteImages).not.toHaveBeenCalled()
    expect(MediaUtils.uploadImages).not.toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith({
      message: 'Comment edited successfully',
      commentId: 'validCommentId'
    })
    expect(res.status).toHaveBeenCalledWith(201)
  })

  it('should throw an error when attempting to edit a non-existing comment', async () => {
    const req = {
      params: {
        commentId: '660d7e17baa5c72965311c7f'
      },
      body: {
        content: 'new comment content'
      },
      decoded: {
        username: 'authorizedUser'
      },
      files: []
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    PostModel.findOne = jest.fn().mockResolvedValue(null)

    await comment.editComment(req, res)

    expect(PostModel.findOne).toHaveBeenCalledWith({ _id: '660d7e17baa5c72965311c7f' })
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Cannot edit a non-existing comment'
    })
  })

  test('should edit an existing comment with image content when valid commentId and files are provided', async () => {
    const req = {
      params: {
        commentId: '660d7e17baa5c72965311c7f'
      },
      body: {},
      decoded: {
        username: 'authorizedUser'
      },
      files: [{ filename: 'image.jpg' }]
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    PostModel.findOne = jest.fn().mockResolvedValue({
      _id: '660d7e17baa5c72965311c7f',
      type: 'Comment',
      username: 'authorizedUser',
      isImage: true,
      content: 'oldImageUrl',
      save: jest.fn()
    })
    MediaUtils.deleteImages = jest.fn().mockResolvedValue()
    MediaUtils.uploadImages = jest.fn().mockResolvedValue(['newImageUrl'])

    await comment.editComment(req, res)

    expect(PostModel.findOne).toHaveBeenCalledWith({ _id: '660d7e17baa5c72965311c7f' })
    expect(MediaUtils.deleteImages).toHaveBeenCalledWith(['oldImageUrl'])
    expect(MediaUtils.uploadImages).toHaveBeenCalledWith([{ filename: 'image.jpg' }])
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Comment edited successfully',
      commentId: '660d7e17baa5c72965311c7f'
    })
  })

  test('should not edit an existing comment with image if it has text', async () => {
    const req = {
      params: {
        commentId: '660d7e17baa5c72965311c7f'
      },
      body: {},
      decoded: {
        username: 'authorizedUser'
      },
      files: [{ filename: 'image.jpg' }]
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    PostModel.findOne = jest.fn().mockResolvedValue({
      _id: '660d7e17baa5c72965311c7f',
      type: 'Comment',
      username: 'authorizedUser',
      isImage: false,
      content: 'text content',
      save: jest.fn()
    })
    MediaUtils.deleteImages = jest.fn().mockResolvedValue()
    MediaUtils.uploadImages = jest.fn().mockResolvedValue(['newImageUrl'])

    await comment.editComment(req, res)

    expect(PostModel.findOne).toHaveBeenCalledWith({ _id: '660d7e17baa5c72965311c7f' })
    expect(MediaUtils.deleteImages).not.toHaveBeenCalledWith(['oldImageUrl'])
    expect(MediaUtils.uploadImages).not.toHaveBeenCalledWith([{ filename: 'image.jpg' }])
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'No text provided'
    })
  })

  test('should not edit an existing comment with text if it has image', async () => {
    const req = {
      params: {
        commentId: '660d7e17baa5c72965311c7f'
      },
      body: {
        content: 'new comment content'
      },
      decoded: {
        username: 'authorizedUser'
      },
      files: []
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    PostModel.findOne = jest.fn().mockResolvedValue({
      _id: '660d7e17baa5c72965311c7f',
      type: 'Comment',
      username: 'authorizedUser',
      isImage: true,
      content: 'oldImageUrl',
      save: jest.fn()
    })
    MediaUtils.deleteImages = jest.fn().mockResolvedValue()
    MediaUtils.uploadImages = jest.fn().mockResolvedValue(['newImageUrl'])

    await comment.editComment(req, res)

    expect(PostModel.findOne).toHaveBeenCalledWith({ _id: '660d7e17baa5c72965311c7f' })
    expect(MediaUtils.deleteImages).not.toHaveBeenCalledWith(['oldImageUrl'])
    expect(MediaUtils.uploadImages).not.toHaveBeenCalledWith([{ filename: 'image.jpg' }])
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'No image provided'
    })
  })
})

describe('deleteComment', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should delete the comment when the comment ID is valid and the user is authorized', async () => {
    const req = {
      params: {
        commentId: 'edc7d65f92ccd6c400f07df0'
      },
      decoded: {
        username: 'authorizedUser'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const commentToDelete = {
      _id: 'edc7d65f92ccd6c400f07df0',
      type: 'Comment',
      username: 'authorizedUser',
      isDeleted: false,
      save: jest.fn()
    }

    PostModel.findOne = jest.fn().mockResolvedValue(commentToDelete)

    await comment.deleteComment(req, res)

    expect(PostModel.findOne).toHaveBeenCalledWith({ _id: 'edc7d65f92ccd6c400f07df0', isDeleted: false })
    expect(commentToDelete.isDeleted).toBe(true)
    expect(commentToDelete.save).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: 'Comment deleted successfully' })
  })

  test('should throw an error if the commentId is invalid', async () => {
    const req = {
      params: {
        commentId: 'InvalidCommentId'
      },
      decoded: {
        username: 'authorizedUser'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    await comment.deleteComment(req, res)

    expect(PostModel.findOne).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Comment ID is invalid' })
  })

  test('should throw an error message when the comment ID does not exist (deleted or non-existing)', async () => {
    const req = {
      params: {
        commentId: 'edc7d65f92ccd6c400f07df0'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    PostModel.findOne = jest.fn().mockResolvedValue(null)

    await comment.deleteComment(req, res)

    expect(PostModel.findOne).toHaveBeenCalledWith({ _id: 'edc7d65f92ccd6c400f07df0', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Cannot delete a non-existing comment' })
  })

  test('should throw an error when the user is not authorized to delete the comment', async () => {
    const req = {
      params: {
        commentId: 'edc7d65f92ccd6c400f07df0'
      },
      decoded: {
        username: 'unauthorizedUser'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const commentToDelete = {
      _id: 'edc7d65f92ccd6c400f07df0',
      type: 'Comment',
      username: 'authorizedUser',
      isDeleted: false,
      save: jest.fn()
    }

    PostModel.findOne = jest.fn().mockResolvedValue(commentToDelete)

    await comment.deleteComment(req, res)

    expect(PostModel.findOne).toHaveBeenCalledWith({ _id: 'edc7d65f92ccd6c400f07df0', isDeleted: false })
    expect(commentToDelete.isDeleted).toBe(false)
    expect(commentToDelete.save).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'You are not authorized to delete this comment' })
  })
})
