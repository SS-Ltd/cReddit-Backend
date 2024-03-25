const PostModel = require('../src/models/Post')
const CommunityModel = require('../src/models/Community')
const UserModel = require('../src/models/User')
const HistoryModel = require('../src/models/History')
const { getPost } = require('../src/controllers/Post')

jest.mock('../src/models/User', () => ({
  findOne: jest.fn()
}))

jest.mock('../src/models/Post', () => ({
  findOne: jest.fn()
}))

jest.mock('../src/models/Community', () => ({
  findOne: jest.fn()
}))

jest.mock('../src/models/History', () => ({
  create: jest.fn()
}))

describe('getPost', () => {
  beforeEach(() => {
    UserModel.findOne.mockClear()
    PostModel.findOne.mockClear()
    CommunityModel.findOne.mockClear()
    HistoryModel.create.mockClear()
  })

  test('should retrieve a post by ID for a guest', async () => {
    const req = {
      params: {
        postId: '12345'
      },
      query: {}
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const post = {
      _id: '12345',
      isDeleted: false,
      communityName: 'community1',
      views: 0,
      save: jest.fn(),
      toObject: jest.fn().mockReturnValue({
        _id: '12345',
        isDeleted: false,
        communityName: 'community1',
        views: 1
      })
    }

    const community = {
      name: 'community1',
      isDeleted: false,
      suggestedSort: 'new'
    }

    const comments = [
      {
        _id: 'comment1',
        comments: []
      }
    ]

    const commentCount = [
      {
        commentCount: 0
      }
    ]

    PostModel.findOne.mockResolvedValue(post)
    CommunityModel.findOne.mockResolvedValue(community)
    post.getComments = jest.fn().mockResolvedValue(comments)
    post.getCommentCount = jest.fn().mockResolvedValue(commentCount)

    await getPost(req, res)

    expect(PostModel.findOne).toHaveBeenCalledWith({ _id: '12345', isDeleted: false })
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'community1', isDeleted: false })
    expect(post.save).toHaveBeenCalled()
    expect(post.getComments).toHaveBeenCalledWith({ sort: { createdAt: -1, _id: -1 }, random: false, limit: 10 })
    expect(post.getCommentCount).toHaveBeenCalled()
    expect(UserModel.findOne).not.toHaveBeenCalled()
    expect(HistoryModel.create).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      _id: '12345',
      isDeleted: false,
      communityName: 'community1',
      views: 1,
      comments: [],
      commentCount: 0
    })
  })

  test('should retrieve a post by ID for a logged in user', async () => {
    const req = {
      params: {
        postId: '12345'
      },
      query: {},
      decoded: {
        username: 'user1'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const post = {
      _id: '12345',
      isDeleted: false,
      communityName: 'community1',
      views: 0,
      save: jest.fn(),
      toObject: jest.fn().mockReturnValue({
        _id: '12345',
        isDeleted: false,
        communityName: 'community1',
        views: 1
      })
    }

    const community = {
      name: 'community1',
      isDeleted: false,
      suggestedSort: 'new'
    }

    const comments = [
      {
        _id: '12345',
        comments: [
          {
            _id: 'comment1'
          }
        ]
      }
    ]

    const commentCount = [
      {
        commentCount: 1
      }
    ]

    const user = {
      username: 'user1',
      isDeleted: false,
      upvotedPosts: ['12345'],
      downvotedPosts: [],
      savedPosts: ['12345'],
      hiddenPosts: [],
      upvotedComments: [],
      downvotedComments: ['comment1'],
      savedComments: []
    }

    PostModel.findOne.mockResolvedValue(post)
    CommunityModel.findOne.mockResolvedValue(community)
    post.getComments = jest.fn().mockResolvedValue(comments)
    post.getCommentCount = jest.fn().mockResolvedValue(commentCount)
    UserModel.findOne.mockResolvedValue(user)

    await getPost(req, res)

    expect(PostModel.findOne).toHaveBeenCalledWith({ _id: '12345', isDeleted: false })
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'community1', isDeleted: false })
    expect(post.save).toHaveBeenCalled()
    expect(post.getComments).toHaveBeenCalledWith({ sort: { createdAt: -1, _id: -1 }, random: false, limit: 10 })
    expect(post.getCommentCount).toHaveBeenCalled()
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'user1', isDeleted: false })
    expect(HistoryModel.create).toHaveBeenCalledWith({ owner: 'user1', post: '12345' })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      _id: '12345',
      isDeleted: false,
      communityName: 'community1',
      views: 1,
      isUpvoted: true,
      isDownvoted: false,
      isSaved: true,
      isHidden: false,
      comments: [
        {
          _id: 'comment1',
          isUpvoted: false,
          isDownvoted: true,
          isSaved: false
        }
      ],
      commentCount: 1
    })
  })

  test('should return 400 if post ID is not provided', async () => {
    const req = {
      params: {},
      query: {}
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    await getPost(req, res)

    expect(PostModel.findOne).not.toHaveBeenCalled()
    expect(CommunityModel.findOne).not.toHaveBeenCalled()
    expect(UserModel.findOne).not.toHaveBeenCalled()
    expect(HistoryModel.create).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Post ID is required'
    })
  })

  test('should return 404 if post does not exist', async () => {
    const req = {
      params: {
        postId: '12345'
      },
      query: {}
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const post = null

    PostModel.findOne = jest.fn().mockResolvedValue(post)

    await getPost(req, res)

    expect(PostModel.findOne).toHaveBeenCalledWith({ _id: '12345', isDeleted: false })
    expect(CommunityModel.findOne).not.toHaveBeenCalled()
    expect(UserModel.findOne).not.toHaveBeenCalled()
    expect(HistoryModel.create).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Post does not exist'
    })
  })

  test('should return 404 if community does not exist', async () => {
    const req = {
      params: {
        postId: '12345'
      },
      query: {}
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const post = {
      _id: '12345',
      isDeleted: false,
      communityName: 'community1',
      views: 0,
      save: jest.fn()
    }

    const community = null

    const comments = [
      {
        _id: '12345',
        comments: []
      }
    ]

    const commentCount = [
      {
        commentCount: 0
      }
    ]

    PostModel.findOne.mockResolvedValue(post)
    CommunityModel.findOne.mockResolvedValue(community)
    post.getComments = jest.fn().mockResolvedValue(comments)
    post.getCommentCount = jest.fn().mockResolvedValue(commentCount)

    await getPost(req, res)

    expect(PostModel.findOne).toHaveBeenCalledWith({ _id: '12345', isDeleted: false })
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'community1', isDeleted: false })
    expect(UserModel.findOne).not.toHaveBeenCalled()
    expect(HistoryModel.create).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Community does not exist'
    })
  })

  test('should return 404 if user does not exist', async () => {
    const req = {
      params: {
        postId: '12345'
      },
      query: {},
      decoded: {
        username: 'user1'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const post = {
      _id: '12345',
      isDeleted: false,
      communityName: 'community1',
      views: 0,
      save: jest.fn(),
      toObject: jest.fn().mockReturnValue({
        _id: '12345',
        isDeleted: false,
        communityName: 'community1',
        views: 1
      })
    }

    const community = {
      name: 'community1',
      isDeleted: false,
      suggestedSort: 'new'
    }

    const comments = [
      {
        _id: '12345',
        comments: []
      }
    ]

    const commentCount = [
      {
        commentCount: 0
      }
    ]

    const user = null

    PostModel.findOne.mockResolvedValue(post)
    CommunityModel.findOne.mockResolvedValue(community)
    post.getComments = jest.fn().mockResolvedValue(comments)
    post.getCommentCount = jest.fn().mockResolvedValue(commentCount)
    UserModel.findOne.mockResolvedValue(user)

    await getPost(req, res)

    expect(PostModel.findOne).toHaveBeenCalledWith({ _id: '12345', isDeleted: false })
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'community1', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'user1', isDeleted: false })
    expect(HistoryModel.create).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      message: 'User does not exist'
    })
  })
})
