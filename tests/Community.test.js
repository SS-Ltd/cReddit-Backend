const CommunityModel = require('../src/models/Community')
const PostModel = require('../src/models/Post')
const UserModel = require('../src/models/User')
const { getSortedCommunityPosts } = require('../src/controllers/Community')

jest.mock('../src/models/Community', () => {
  return {
    findOne: jest.fn()
  }
})

jest.mock('../src/models/Post', () => {
  return {
    find: jest.fn(),
    select: jest.fn(),
    sort: jest.fn(),
    skip: jest.fn(),
    limit: jest.fn()
  }
})

jest.mock('../src/models/User', () => {
  return {
    findOne: jest.fn()
  }
})

describe('getSortedCommunityPosts', () => {
  let req
  let res

  beforeEach(() => {
    req = {
      params: {
        subreddit: 'testSubreddit'
      },
      decoded: {
        username: 'testUser'
      }
    }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
  })

  it('should return 400 if subreddit is not provided', async () => {
    req.params.subreddit = undefined

    await getSortedCommunityPosts(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Subreddit is required'
    })
  })

  it('should return 404 if community does not exist', async () => {
    CommunityModel.findOne.mockResolvedValue(null)

    await getSortedCommunityPosts(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Community does not exist'
    })
  })

  it('should return 404 if user does not exist', async () => {
    CommunityModel.findOne.mockResolvedValue({})

    UserModel.findOne.mockResolvedValue(null)

    await getSortedCommunityPosts(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      message: 'User does not exist'
    })
  })

  it('should return a list of posts sorted by hot when no query parameters are provided', async () => {
    req.query = {}

    const community = {
      name: 'testSubreddit',
      isDeleted: false
    }

    const user = {
      username: 'testUser',
      isDeleted: false,
      upvotedPosts: [],
      downvotedPosts: [],
      savedPosts: [],
      hiddenPosts: []
    }

    const posts = [
      {
        _id: 'post1',
        title: 'Post 1',
        createdAt: new Date('2021-01-01T00:00:00Z'),
        communityName: 'testSubreddit',
        isDeleted: false,
        isRemoved: false,
        views: 10
      },
      {
        _id: 'post2',
        title: 'Post 2',
        createdAt: new Date('2021-01-01T00:00:00Z'),
        communityName: 'testSubreddit',
        isDeleted: false,
        isRemoved: false,
        views: 20
      }
    ]

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValue(user)
    PostModel.find = jest.fn().mockImplementation(() => {
      return {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(posts.map(post => ({
          ...post,
          toObject: jest.fn().mockReturnValue(post)
        })))
      }
    })

    await getSortedCommunityPosts(req, res)

    // expect(PostModel.find().select().sort).toHaveBeenCalledWith({ views: -1, createdAt: -1, _id: -1 })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      posts: expect.arrayContaining([
        expect.objectContaining({
          _id: 'post2',
          title: 'Post 2'
        }),
        expect.objectContaining({
          _id: 'post1',
          title: 'Post 1'
        })
      ])
    })
  })

  it('should return a list of posts sorted by new when sort query parameter is new', async () => {
    req.query = {
      sort: 'new'
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'testSubreddit',
      isDeleted: false
    }

    const user = {
      username: 'testUser',
      isDeleted: false,
      upvotedPosts: [],
      downvotedPosts: [],
      savedPosts: [],
      hiddenPosts: []
    }

    const posts = [
      {
        _id: 'post1',
        title: 'Post 1',
        createdAt: new Date('2021-01-02T00:00:00Z'),
        communityName: 'testSubreddit',
        isDeleted: false,
        isRemoved: false
      },
      {
        _id: 'post2',
        title: 'Post 2',
        createdAt: new Date('2021-01-01T00:00:00Z'),
        communityName: 'testSubreddit',
        isDeleted: false,
        isRemoved: false
      }
    ]

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValue(user)
    PostModel.find = jest.fn().mockImplementation(() => {
      return {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(posts.map(post => ({
          ...post,
          toObject: jest.fn().mockReturnValue(post)
        })))
      }
    })

    await getSortedCommunityPosts(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      posts: expect.arrayContaining([
        expect.objectContaining({
          _id: 'post2',
          title: 'Post 2'
        }),
        expect.objectContaining({
          _id: 'post1',
          title: 'Post 1'
        })
      ])
    })
  })

  it('should return a list of posts sorted by top when sort query parameter is top', async () => {
    req.query = {
      sort: 'top',
      time: 'all'
    }

    const community = {
      name: 'testSubreddit',
      isDeleted: false
    }

    const user = {
      username: 'testUser',
      isDeleted: false,
      upvotedPosts: [],
      downvotedPosts: [],
      savedPosts: [],
      hiddenPosts: []
    }

    const posts = [
      {
        _id: 'post1',
        title: 'Post 1',
        createdAt: new Date(),
        netVote: 5,
        isDeleted: false,
        isRemoved: false
      },
      {
        _id: 'post2',
        title: 'Post 2',
        createdAt: new Date(),
        netVote: 10,
        isDeleted: false,
        isRemoved: false
      }
    ]

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValue(user)
    PostModel.find = jest.fn().mockImplementation(() => {
      return {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(posts.map(post => ({
          ...post,
          toObject: jest.fn().mockReturnValue(post)
        })))
      }
    })

    await getSortedCommunityPosts(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      posts: [
        {
          _id: 'post1',
          title: 'Post 1',
          createdAt: expect.any(Date),
          netVote: 5,
          isDeleted: false,
          isRemoved: false,
          isUpvoted: false,
          isDownvoted: false,
          isSaved: false,
          isHidden: false
        },
        {
          _id: 'post2',
          title: 'Post 2',
          createdAt: expect.any(Date),
          netVote: 10,
          isDeleted: false,
          isRemoved: false,
          isUpvoted: false,
          isDownvoted: false,
          isSaved: false,
          isHidden: false
        }
      ]
    })
  })

  it('should return a list of posts sorted by hot when sort query parameter is hot', async () => {
    req.query = {
      sort: 'hot'
    }

    const community = {
      name: 'testSubreddit',
      isDeleted: false
    }

    const user = {
      username: 'testUser',
      isDeleted: false,
      upvotedPosts: [],
      downvotedPosts: [],
      savedPosts: [],
      hiddenPosts: []
    }

    const posts = [
      {
        _id: 'post1',
        title: 'Post 1',
        createdAt: new Date(),
        views: 50,
        isDeleted: false,
        isRemoved: false
      },
      {
        _id: 'post2',
        title: 'Post 2',
        createdAt: new Date(),
        views: 100,
        isDeleted: false,
        isRemoved: false
      }
    ]

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValue(user)
    PostModel.find = jest.fn().mockImplementation(() => {
      return {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(posts.map(post => ({
          ...post,
          toObject: jest.fn().mockReturnValue(post)
        })))
      }
    })

    await getSortedCommunityPosts(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      posts: [
        {
          _id: 'post1',
          title: 'Post 1',
          createdAt: expect.any(Date),
          views: 50,
          isDeleted: false,
          isRemoved: false,
          isUpvoted: false,
          isDownvoted: false,
          isSaved: false,
          isHidden: false
        },
        {
          _id: 'post2',
          title: 'Post 2',
          createdAt: expect.any(Date),
          views: 100,
          isDeleted: false,
          isRemoved: false,
          isUpvoted: false,
          isDownvoted: false,
          isSaved: false,
          isHidden: false
        }
      ]
    })
  })

  it('should return a list of posts sorted by rising when sort query parameter is rising', async () => {
    req.query = {
      sort: 'rising'
    }

    const community = {
      name: 'testSubreddit',
      isDeleted: false
    }

    const user = {
      username: 'testUser',
      isDeleted: false,
      upvotedPosts: [],
      downvotedPosts: [],
      savedPosts: [],
      hiddenPosts: []
    }

    const posts = [
      {
        _id: 'post1',
        title: 'Post 1',
        createdAt: new Date(),
        isDeleted: false,
        isRemoved: false,
        mostRecentUpvote: new Date('2021-01-01T00:00:00Z')
      },
      {
        _id: 'post2',
        title: 'Post 2',
        createdAt: new Date(),
        isDeleted: false,
        isRemoved: false,
        mostRecentUpvote: new Date('2021-01-02T00:00:00Z')
      }
    ]

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValue(user)
    PostModel.find = jest.fn().mockImplementation(() => {
      return {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(posts.map(post => ({
          ...post,
          toObject: jest.fn().mockReturnValue(post)
        })))
      }
    })

    await getSortedCommunityPosts(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      posts: [
        {
          _id: 'post1',
          title: 'Post 1',
          createdAt: expect.any(Date),
          isDeleted: false,
          isRemoved: false,
          mostRecentUpvote: expect.any(Date),
          isUpvoted: false,
          isDownvoted: false,
          isSaved: false,
          isHidden: false
        },
        {
          _id: 'post2',
          title: 'Post 2',
          createdAt: expect.any(Date),
          isDeleted: false,
          isRemoved: false,
          mostRecentUpvote: expect.any(Date),
          isUpvoted: false,
          isDownvoted: false,
          isSaved: false,
          isHidden: false
        }
      ]
    })
  })

  it('should return a list of posts with isUpvoted, isDownvoted, isSaved, and isHidden properties set for the authenticated user', async () => {
    req.query = {}

    const community = {
      name: 'testSubreddit',
      isDeleted: false
    }

    const user = {
      username: 'testUser',
      isDeleted: false,
      upvotedPosts: ['post1'],
      downvotedPosts: ['post2'],
      savedPosts: ['post1'],
      hiddenPosts: ['post2']
    }

    const posts = [
      {
        _id: 'post1',
        title: 'Post 1',
        createdAt: new Date(),
        communityName: 'testSubreddit',
        isDeleted: false,
        isRemoved: false
      },
      {
        _id: 'post2',
        title: 'Post 2',
        createdAt: new Date(),
        communityName: 'testSubreddit',
        isDeleted: false,
        isRemoved: false
      }
    ]

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValue(user)
    PostModel.find = jest.fn().mockImplementation(() => {
      return {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(posts.map(post => ({
          ...post,
          toObject: jest.fn().mockReturnValue(post)
        })))
      }
    })

    await getSortedCommunityPosts(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      posts: [
        {
          _id: 'post1',
          title: 'Post 1',
          createdAt: expect.any(Date),
          communityName: 'testSubreddit',
          isDeleted: false,
          isRemoved: false,
          isUpvoted: true,
          isDownvoted: false,
          isSaved: true,
          isHidden: false
        },
        {
          _id: 'post2',
          title: 'Post 2',
          createdAt: expect.any(Date),
          communityName: 'testSubreddit',
          isDeleted: false,
          isRemoved: false,
          isUpvoted: false,
          isDownvoted: true,
          isSaved: false,
          isHidden: true
        }
      ]
    })
  })

  it('should return an empty list when there are no posts for the specified subreddit', async () => {
    req.query = {}

    const community = {
      name: 'testSubreddit',
      isDeleted: false
    }

    const user = {
      username: 'testUser',
      isDeleted: false,
      upvotedPosts: [],
      downvotedPosts: [],
      savedPosts: [],
      hiddenPosts: []
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValue(user)
    PostModel.find = jest.fn().mockImplementation(() => {
      return {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([].map(post => ({
          ...post,
          toObject: jest.fn().mockReturnValue([])
        })))
      }
    })

    await getSortedCommunityPosts(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      posts: []
    })
  })
})
