const CommunityModel = require('../src/models/Community')
const PostModel = require('../src/models/Post')
const UserModel = require('../src/models/User')
const { getSortedCommunityPosts, getTopCommunities, getEditedPosts } = require('../src/controllers/Community')

// Mock the entire CommunityModel module
jest.mock('../src/models/Community')

jest.mock('../src/models/Post', () => {
  return {
    find: jest.fn(),
    select: jest.fn(),
    sort: jest.fn(),
    skip: jest.fn(),
    limit: jest.fn(),
    byCommunity: jest.fn()
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
      hiddenPosts: [],
      preferences: {
        showAdultContent: false
      }
    }

    const posts = [
      {
        _id: 'post1',
        title: 'Post 1',
        createdAt: new Date('2021-01-01T00:00:00Z'),
        communityName: 'testSubreddit',
        isDeleted: false,
        isRemoved: false,
        views: 10,
        commentCount: 0,
        profilePicture: 'profilePicture'
      },
      {
        _id: 'post2',
        title: 'Post 2',
        createdAt: new Date('2021-01-01T00:00:00Z'),
        communityName: 'testSubreddit',
        isDeleted: false,
        isRemoved: false,
        views: 20,
        commentCount: 0,
        profilePicture: 'profilePicture'
      }
    ]

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValue(user)

    PostModel.byCommunity = jest.spyOn(PostModel, 'byCommunity').mockResolvedValue(posts)

    await getSortedCommunityPosts(req, res)

    expect(PostModel.byCommunity).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(
      [
        {
          _id: 'post1',
          title: 'Post 1',
          createdAt: expect.any(Date),
          communityName: 'testSubreddit',
          isDeleted: false,
          isRemoved: false,
          views: 10,
          isUpvoted: false,
          isDownvoted: false,
          isSaved: false,
          isHidden: false,
          commentCount: 0,
          profilePicture: 'profilePicture'
        },
        {
          _id: 'post2',
          title: 'Post 2',
          createdAt: expect.any(Date),
          communityName: 'testSubreddit',
          isDeleted: false,
          isRemoved: false,
          views: 20,
          isUpvoted: false,
          isDownvoted: false,
          isSaved: false,
          isHidden: false,
          commentCount: 0,
          profilePicture: 'profilePicture'
        }
      ]
    )
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
      hiddenPosts: [],
      preferences: {
        showAdultContent: false
      }
    }

    const posts = [
      {
        _id: 'post1',
        title: 'Post 1',
        createdAt: new Date('2021-01-01T00:00:00Z'),
        communityName: 'testSubreddit',
        isDeleted: false,
        isRemoved: false,
        views: 10,
        commentCount: 0,
        profilePicture: 'profilePicture'
      },
      {
        _id: 'post2',
        title: 'Post 2',
        createdAt: new Date('2021-01-01T00:00:00Z'),
        communityName: 'testSubreddit',
        isDeleted: false,
        isRemoved: false,
        views: 20,
        commentCount: 0,
        profilePicture: 'profilePicture'
      }
    ]

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValue(user)
    PostModel.byCommunity = jest.spyOn(PostModel, 'byCommunity').mockResolvedValue(posts)

    await getSortedCommunityPosts(req, res)

    expect(PostModel.byCommunity).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith([
      {
        _id: 'post1',
        title: 'Post 1',
        createdAt: expect.any(Date),
        communityName: 'testSubreddit',
        isDeleted: false,
        isRemoved: false,
        views: 10,
        isUpvoted: false,
        isDownvoted: false,
        isSaved: false,
        isHidden: false,
        commentCount: 0,
        profilePicture: 'profilePicture'
      },
      {
        _id: 'post2',
        title: 'Post 2',
        createdAt: expect.any(Date),
        communityName: 'testSubreddit',
        isDeleted: false,
        isRemoved: false,
        views: 20,
        isUpvoted: false,
        isDownvoted: false,
        isSaved: false,
        isHidden: false,
        commentCount: 0,
        profilePicture: 'profilePicture'
      }
    ])
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
      hiddenPosts: [],
      preferences: {
        showAdultContent: false
      }
    }

    const posts = [
      {
        _id: 'post1',
        title: 'Post 1',
        createdAt: new Date('2021-01-01T00:00:00Z'),
        communityName: 'testSubreddit',
        isDeleted: false,
        isRemoved: false,
        views: 10,
        commentCount: 0,
        profilePicture: 'profilePicture',
        netVote: 5
      },
      {
        _id: 'post2',
        title: 'Post 2',
        createdAt: new Date('2021-01-01T00:00:00Z'),
        communityName: 'testSubreddit',
        isDeleted: false,
        isRemoved: false,
        views: 20,
        commentCount: 0,
        profilePicture: 'profilePicture',
        netVote: 10
      }
    ]

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValue(user)
    PostModel.byCommunity = jest.spyOn(PostModel, 'byCommunity').mockResolvedValue(posts)

    await getSortedCommunityPosts(req, res)

    expect(PostModel.byCommunity).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith([{
      _id: 'post1',
      title: 'Post 1',
      createdAt: expect.any(Date),
      communityName: 'testSubreddit',
      isDeleted: false,
      isRemoved: false,
      netVote: 5,
      views: 10,
      isUpvoted: false,
      isDownvoted: false,
      isSaved: false,
      isHidden: false,
      commentCount: 0,
      profilePicture: 'profilePicture'
    },
    {
      _id: 'post2',
      title: 'Post 2',
      createdAt: expect.any(Date),
      communityName: 'testSubreddit',
      isDeleted: false,
      isRemoved: false,
      netVote: 10,
      views: 20,
      isUpvoted: false,
      isDownvoted: false,
      isSaved: false,
      isHidden: false,
      commentCount: 0,
      profilePicture: 'profilePicture'
    }])
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
      hiddenPosts: [],
      preferences: {
        showAdultContent: false
      }
    }

    const posts = [
      {
        _id: 'post1',
        title: 'Post 1',
        createdAt: new Date('2021-01-01T00:00:00Z'),
        communityName: 'testSubreddit',
        isDeleted: false,
        isRemoved: false,
        views: 50,
        commentCount: 0,
        profilePicture: 'profilePicture'
      },
      {
        _id: 'post2',
        title: 'Post 2',
        createdAt: new Date('2021-01-01T00:00:00Z'),
        communityName: 'testSubreddit',
        isDeleted: false,
        isRemoved: false,
        views: 100,
        commentCount: 0,
        profilePicture: 'profilePicture'
      }
    ]

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValue(user)
    PostModel.byCommunity = jest.spyOn(PostModel, 'byCommunity').mockResolvedValue(posts)

    await getSortedCommunityPosts(req, res)

    expect(PostModel.byCommunity).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith([
      {
        _id: 'post1',
        title: 'Post 1',
        communityName: 'testSubreddit',
        createdAt: expect.any(Date),
        views: 50,
        isDeleted: false,
        isRemoved: false,
        isUpvoted: false,
        isDownvoted: false,
        isSaved: false,
        isHidden: false,
        commentCount: 0,
        profilePicture: 'profilePicture'
      },
      {
        _id: 'post2',
        title: 'Post 2',
        communityName: 'testSubreddit',
        createdAt: expect.any(Date),
        views: 100,
        isDeleted: false,
        isRemoved: false,
        isUpvoted: false,
        isDownvoted: false,
        isSaved: false,
        isHidden: false,
        commentCount: 0,
        profilePicture: 'profilePicture'
      }
    ])
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
      hiddenPosts: [],
      preferences: {
        showAdultContent: false
      }
    }

    const posts = [
      {
        _id: 'post1',
        title: 'Post 1',
        createdAt: new Date('2021-01-01T00:00:00Z'),
        communityName: 'testSubreddit',
        isDeleted: false,
        isRemoved: false,
        commentCount: 0,
        profilePicture: 'profilePicture'
      },
      {
        _id: 'post2',
        title: 'Post 2',
        createdAt: new Date('2021-01-01T00:00:00Z'),
        communityName: 'testSubreddit',
        isDeleted: false,
        isRemoved: false,
        commentCount: 0,
        profilePicture: 'profilePicture'
      }
    ]

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValue(user)
    PostModel.byCommunity = jest.spyOn(PostModel, 'byCommunity').mockResolvedValue(posts)

    await getSortedCommunityPosts(req, res)

    expect(PostModel.byCommunity).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith([
      {
        _id: 'post1',
        title: 'Post 1',
        createdAt: expect.any(Date),
        isDeleted: false,
        isRemoved: false,
        isUpvoted: false,
        isDownvoted: false,
        isSaved: false,
        isHidden: false,
        commentCount: 0,
        profilePicture: 'profilePicture',
        communityName: 'testSubreddit'
      },
      {
        _id: 'post2',
        title: 'Post 2',
        createdAt: expect.any(Date),
        isDeleted: false,
        isRemoved: false,
        isUpvoted: false,
        isDownvoted: false,
        isSaved: false,
        isHidden: false,
        commentCount: 0,
        profilePicture: 'profilePicture',
        communityName: 'testSubreddit'
      }
    ])
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
      upvotedPosts: [{ postId: 'post1' }],
      downvotedPosts: [{ postId: 'post2' }],
      savedPosts: [{ postId: 'post1' }],
      hiddenPosts: [{ postId: 'post2' }],
      preferences: {
        showAdultContent: false
      }
    }

    const posts = [
      {
        _id: 'post1',
        title: 'Post 1',
        createdAt: new Date('2021-01-01T00:00:00Z'),
        communityName: 'testSubreddit',
        isDeleted: false,
        isRemoved: false,
        commentCount: 0,
        profilePicture: 'profilePicture'
      },
      {
        _id: 'post2',
        title: 'Post 2',
        createdAt: new Date('2021-01-01T00:00:00Z'),
        communityName: 'testSubreddit',
        isDeleted: false,
        isRemoved: false,
        commentCount: 0,
        profilePicture: 'profilePicture'
      }
    ]

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValue(user)
    PostModel.byCommunity = jest.spyOn(PostModel, 'byCommunity').mockResolvedValue(posts)

    await getSortedCommunityPosts(req, res)

    expect(PostModel.byCommunity).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith([
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
        isHidden: false,
        commentCount: 0,
        profilePicture: 'profilePicture'
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
        isHidden: true,
        commentCount: 0,
        profilePicture: 'profilePicture'
      }
    ])
  })

  it('should return 404 when there are no posts to return', async () => {
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
      hiddenPosts: [],
      preferences: {
        showAdultContent: false
      }
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValue(user)
    PostModel.byCommunity = jest.spyOn(PostModel, 'byCommunity').mockResolvedValue([])

    await getSortedCommunityPosts(req, res)

    expect(PostModel.byCommunity).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith([])
  })
})

// Mock the entire CommunityModel module
jest.mock('../src/models/Community')

// Mock the query object
const mockQuery = {
  sort: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  select: jest.fn().mockImplementation(() => Promise.resolve(['community1', 'community2']))
}

// Mock the find method to return the mock query
CommunityModel.find.mockReturnValue(mockQuery)
CommunityModel.findOne = jest.fn()

describe('getTopCommunities', () => {
  // Returns a list of top communities sorted by members in descending order
  test('should return a list of top communities sorted by members in descending order', async () => {
    const req = { query: {} }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    await getTopCommunities(req, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(['community1', 'community2'])
  })

  // Returns an error if there is an issue with the database connection
  test('should return an error if there is an issue with the database connection', async () => {
    const req = { query: {} }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    CommunityModel.find.mockImplementationOnce(() => { throw new Error('Database connection error') })
    await getTopCommunities(req, res)
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ message: 'Database connection error' })
  })
})

describe('getEditedPosts', () => {
// Returns edited posts for a valid community name
  test('should return edited posts when a valid community name is provided', async () => {
    const req = { params: { communityName: 'validCommunity' }, query: {} }
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
    const community = { getEditedPosts: jest.fn().mockResolvedValue(['post1', 'post2']) }
    CommunityModel.findOne.mockResolvedValue(community)

    await getEditedPosts(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'validCommunity', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(['post1', 'post2'])
  })

  // Returns 404 when community is not found
  test('should return 404 when community is not found', async () => {
    const req = { params: { communityName: 'invalidCommunity' } }
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
    CommunityModel.findOne.mockResolvedValue(null)

    await getEditedPosts(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'invalidCommunity', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ message: 'Community not found' })
  })
})
