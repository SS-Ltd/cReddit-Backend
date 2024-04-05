const PostModel = require('../src/models/Post')
const UserModel = require('../src/models/User')
const HistoryModel = require('../src/models/History')
const { getComment } = require('../src/controllers/Comment')

jest.mock('../src/models/Post', () => {
  return {
    getComment: jest.fn(),
    getPost: jest.fn()
  }
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
      }
    }

    const history = {
      owner: 'testUser',
      post: '8208ebbb65d8488cfcc0a686',
      save: jest.fn()
    }

    UserModel.findOne.mockResolvedValue(user)
    PostModel.getComment.mockResolvedValue([comment])
    PostModel.getPost.mockResolvedValue([post])
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
      postID: '8208ebbb65d8488cfcc0a686'
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
      postID: '8208ebbb65d8488cfcc0a686'
    }

    const post = {
      isNsfw: true
    }

    const user = {
      upvotedPosts: [],
      downvotedPosts: [],
      savedPosts: [],
      preferences: {
        showAdultContent: false
      }
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
