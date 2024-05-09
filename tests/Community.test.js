const CommunityModel = require('../src/models/Community')
const PostModel = require('../src/models/Post')
const UserModel = require('../src/models/User')
const MediaUtils = require('../src/utils/Media')
const { createCommunity, isNameAvailable, getCommunityView, getSortedCommunityPosts, getTopCommunities, getEditedPosts, joinCommunity, leaveCommunity, muteCommunity, getReportedPosts, getCommunityRules, updateCommunityRules, getCommunitySettings, updateCommunitySettings, getScheduledPosts, getUnmoderatedPosts, updateCommunityBanner } = require('../src/controllers/Community')

// Mock the entire CommunityModel module
jest.mock('../src/models/Community')

jest.mock('../src/models/Post', () => {
  return {
    find: jest.fn(),
    select: jest.fn(),
    sort: jest.fn(),
    skip: jest.fn(),
    limit: jest.fn(),
    byCommunity: jest.fn(),
    save: jest.fn()
  }
})

jest.mock('../src/models/User', () => {
  return {
    findOne: jest.fn(),
    save: jest.fn()
  }
})

describe('createCommunity', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should create a community with valid name, isNSFW and type', async () => {
    const req = {
      decoded: {
        username: 'testUser'
      },
      body: {
        name: 'testCommunity',
        isNSFW: false,
        type: 'public'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const user = {
      username: 'testUser',
      isDeleted: false,
      communities: [],
      moderatorInCommunities: [],
      save: jest.fn()
    }

    const community = {
      name: 'testCommunity',
      owner: 'testUser',
      isNSFW: false,
      type: 'public',
      moderators: [],
      save: jest.fn()
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(null)
    UserModel.findOne = jest.fn().mockResolvedValue(user)
    CommunityModel.mockImplementation(() => community)

    await createCommunity(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testCommunity' })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser', isDeleted: false })
    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(UserModel.findOne).toHaveBeenCalledTimes(1)
    expect(CommunityModel).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Community created successfully',
      owner: 'testUser',
      name: 'testCommunity',
      isNSFW: false
    })
  })

  test('should return an error when creating a community without a name', async () => {
    const req = {
      decoded: {
        username: 'testUser'
      },
      body: {
        isNSFW: false,
        type: 'public'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    await createCommunity(req, res)

    expect(CommunityModel.findOne).not.toHaveBeenCalled()
    expect(CommunityModel).not.toHaveBeenCalled()
    expect(UserModel.findOne).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Name and isNSFW are required' })
  })

  test('should return a 400 status and an error message when isNSFW is missing', async () => {
    const req = {
      decoded: {
        username: 'testUser'
      },
      body: {
        name: 'testCommunity',
        type: 'public'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    await createCommunity(req, res)

    expect(CommunityModel.findOne).not.toHaveBeenCalled()
    expect(CommunityModel).not.toHaveBeenCalled()
    expect(UserModel.findOne).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Name and isNSFW are required' })
  })

  test('should return an error message when trying to create a community with an already existing name', async () => {
    const req = {
      decoded: {
        username: 'testUser'
      },
      body: {
        name: 'existingCommunity',
        isNSFW: false,
        type: 'public'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const repeatedCommunity = {
      name: 'existingCommunity'
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(repeatedCommunity)

    await createCommunity(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'existingCommunity' })
    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(CommunityModel).not.toHaveBeenCalled()
    expect(UserModel.findOne).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Community already exists' })
  })

  test('should return a 404 error when trying to create a community with a non-existent owner', async () => {
    const req = {
      decoded: {
        username: 'nonExistentUser'
      },
      body: {
        name: 'testCommunity',
        isNSFW: false,
        type: 'public'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(null)
    UserModel.findOne = jest.fn().mockResolvedValue(null)

    await createCommunity(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testCommunity' })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'nonExistentUser', isDeleted: false })
    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(UserModel.findOne).toHaveBeenCalledTimes(1)
    expect(CommunityModel).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' })
  })

  test('should return an error when creating a community with an invalid type', async () => {
    const req = {
      decoded: {
        username: 'testUser'
      },
      body: {
        name: 'testCommunity',
        isNSFW: false,
        type: 'invalidType'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const user = {
      username: 'testUser',
      isDeleted: false,
      communities: [],
      moderatorInCommunities: [],
      save: jest.fn()
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(null)
    UserModel.findOne = jest.fn().mockResolvedValue(user)

    await createCommunity(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testCommunity' })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser', isDeleted: false })
    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(UserModel.findOne).toHaveBeenCalledTimes(1)
    expect(CommunityModel).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid community type' })
  })
})

describe('isNameAvailable', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 200 status code and message \'Name is available\' when name is not found in CommunityModel', async () => {
    const req = {
      params: {
        name: 'ApexLegends'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(null)

    await isNameAvailable(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'ApexLegends' })
    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Name is available',
      available: true
    })
  })

  test('should return 409 status code and message \'Name is not available\' when name is found in CommunityModel', async () => {
    const req = {
      params: {
        name: 'ApexLegends'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue({})

    await isNameAvailable(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'ApexLegends' })
    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Name is not available',
      available: false
    })
  })

  test('should return 400 status code and message \'Name is required\' when name is not provided', () => {
    const req = {
      params: {}
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    isNameAvailable(req, res)

    expect(CommunityModel.findOne).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Name is required'
    })
  })
})

describe('getCommunityView', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should retrieve community data successfully when subreddit name is provided and community exists', async () => {
    const req = {
      params: {
        subreddit: 'testSubreddit'
      },
      decoded: {
        username: 'testUser'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'testSubreddit',
      icon: 'testIcon',
      banner: 'testBanner',
      members: 100,
      rules: ['rule1', 'rule2'],
      description: 'testDescription',
      topic: 'testTopic',
      moderators: ['moderator1', 'moderator2'],
      isNSFW: false,
      type: 'public'
    }

    const moderator1 = {
      username: 'moderator1',
      profilePicture: 'profilePicture1'
    }

    const moderator2 = {
      username: 'moderator2',
      profilePicture: 'profilePicture2'
    }

    const user = {
      username: 'testUser',
      moderatorInCommunities: ['testSubreddit'],
      communities: ['testSubreddit'],
      mutedCommunities: []
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn()
      .mockResolvedValueOnce(moderator1)
      .mockResolvedValueOnce(moderator2)
    UserModel.findOne.mockResolvedValue(user)

    await getCommunityView(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testSubreddit' })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'moderator1' })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'moderator2' })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser' })
    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(UserModel.findOne).toHaveBeenCalledTimes(3)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      name: 'testSubreddit',
      icon: 'testIcon',
      banner: 'testBanner',
      members: 100,
      rules: ['rule1', 'rule2'],
      description: 'testDescription',
      topic: 'testTopic',
      moderators: [
        {
          username: 'moderator1',
          profilePicture: 'profilePicture1'
        },
        {
          username: 'moderator2',
          profilePicture: 'profilePicture2'
        }
      ],
      isNSFW: false,
      type: 'public',
      isModerator: true,
      isMember: true,
      isMuted: false
    })
  })

  test('should return error message when subreddit name is not provided', async () => {
    const req = {
      params: {},
      decoded: {
        username: 'testUser'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    await getCommunityView(req, res)

    expect(CommunityModel.findOne).not.toHaveBeenCalled()
    expect(UserModel.findOne).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Error getting subreddit view: Subreddit name is required' })
  })

  test('should return error message when subreddit name is provided but community does not exist', async () => {
    const req = {
      params: {
        subreddit: 'nonExistentSubreddit'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = null

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)

    await getCommunityView(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'nonExistentSubreddit' })
    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(UserModel.findOne).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ message: 'Subreddit not found' })
  })

  test('should return error message when subreddit name is provided but community is deleted', async () => {
    const req = {
      params: {
        subreddit: 'testSubreddit'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'testSubreddit',
      isDeleted: true
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)

    await getCommunityView(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testSubreddit' })
    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(UserModel.findOne).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ message: 'Subreddit not found' })
  })
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
      },
      moderatorInCommunities: [],
      blockedUsers: []
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
      },
      moderatorInCommunities: [],
      blockedUsers: []
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
      },
      moderatorInCommunities: [],
      blockedUsers: []
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
      },
      moderatorInCommunities: [],
      blockedUsers: []
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
      },
      moderatorInCommunities: [],
      blockedUsers: []
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
      },
      moderatorInCommunities: [],
      blockedUsers: []
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
      },
      moderatorInCommunities: [],
      blockedUsers: []
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
  select: jest.fn().mockImplementation(() => Promise.resolve([
    { toObject: () => 'community1' },
    { toObject: () => 'community2' }
  ]))
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

    CommunityModel.select = jest.fn().mockResolvedValue([{ communityName: 'community1' }, { communityName: 'community2' }])
    CommunityModel.countDocuments = jest.fn().mockResolvedValue(2)

    await getTopCommunities(req, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(
      {
        topCommunities: ['community1', 'community2'],
        count: 2
      }
    )
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

describe('joinCommunity', () => {
  // User successfully joins a community
  beforeEach(() => {
    UserModel.findOne.mockClear()
  })

  it('should return a 200 status code and a success message when user successfully joins a community', async () => {
    const req = {
      params: {
        subreddit: 'testSubreddit'
      },
      decoded: {
        username: 'testUser'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    UserModel.findOne = jest.fn().mockResolvedValue({ username: 'testUser', isDeleted: false, communities: [], save: jest.fn() })

    CommunityModel.findOne = jest.fn().mockResolvedValue({ name: 'testSubreddit', isDeleted: false, members: 5, blockedUsers: [], save: jest.fn() })

    await joinCommunity(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      message: 'User joined the community successfully'
    })
  })

  // Community does not exist, returns 500 error
  it('should return a 404 status code and an error message when the community does not exist', async () => {
    const req = {
      params: {
        subreddit: 'nonExistentSubreddit'
      },
      decoded: {
        username: 'testUser'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(null)

    await joinCommunity(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Community not found'
    })
  })
})

describe('leaveCommunity', () => {
  test('should remove community from user\'s list of communities, decrease community\'s member count, and return success message with status code 200', async () => {
    const req = {
      params: {
        subreddit: 'testSubreddit'
      },
      decoded: {
        username: 'testUser'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'testSubreddit',
      isDeleted: false,
      type: 'public',
      members: 5,
      save: jest.fn()
    }

    const user = {
      username: 'testUser',
      communities: ['testSubreddit'],
      save: jest.fn()
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValue(user)

    await leaveCommunity(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testSubreddit', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser', isDeleted: false })
    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(UserModel.findOne).toHaveBeenCalledTimes(1)
    expect(user.communities).not.toContain('testSubreddit')
    expect(community.members).toBe(4)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      message: 'User left the community successfully'
    })
  })

  test('should remove community from user\'s list of communities, decrease community\'s member count, and return success message with status code 200', async () => {
    const req = {
      params: {
        subreddit: 'testSubreddit'
      },
      decoded: {
        username: 'testUser'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'testSubreddit',
      isDeleted: false,
      type: 'private',
      members: 5,
      approvedUsers: ['testUser'],
      save: jest.fn()
    }

    const user = {
      username: 'testUser',
      communities: ['testSubreddit'],
      approvedInCommunities: ['testSubreddit'],
      save: jest.fn()
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValue(user)

    await leaveCommunity(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testSubreddit', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser', isDeleted: false })
    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(UserModel.findOne).toHaveBeenCalledTimes(1)
    expect(user.communities).not.toContain('testSubreddit')
    expect(user.approvedInCommunities).not.toContain('testSubreddit')
    expect(community.members).toBe(4)
    expect(community.approvedUsers).not.toContain('testUser')
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      message: 'User left the community successfully'
    })
  })

  test('should return error message with status code 400 when user is not a member of the community', async () => {
    const req = {
      params: {
        subreddit: 'testSubreddit'
      },
      decoded: {
        username: 'testUser'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'testSubreddit',
      isDeleted: false,
      type: 'public',
      members: 5
    }

    const user = {
      username: 'testUser',
      communities: []
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValue(user)

    await leaveCommunity(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testSubreddit', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser', isDeleted: false })
    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(UserModel.findOne).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'User is not a member of the community'
    })
  })
})

describe('muteCommunity', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should successfully mute a community for a user who has not muted it before', async () => {
    const req = {
      params: {
        subreddit: 'testSubreddit'
      },
      decoded: {
        username: 'testUser'
      }
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
      mutedCommunities: [],
      save: jest.fn()
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValue(user)

    await muteCommunity(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testSubreddit', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser', isDeleted: false })
    expect(user.mutedCommunities).toContain('testSubreddit')
    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(UserModel.findOne).toHaveBeenCalledTimes(1)
    expect(user.save).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Community muted successfully'
    })
  })

  test('should successfully unmute a community for a user who has muted it before', async () => {
    const req = {
      params: {
        subreddit: 'testSubreddit'
      },
      decoded: {
        username: 'testUser'
      }
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
      mutedCommunities: ['testSubreddit'],
      save: jest.fn()
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValue(user)

    await muteCommunity(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testSubreddit', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser', isDeleted: false })
    expect(user.mutedCommunities).not.toContain('testSubreddit')
    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(UserModel.findOne).toHaveBeenCalledTimes(1)
    expect(user.save).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Community unmuted successfully'
    })
  })

  test('should return a 404 error when the community does not exist', async () => {
    const req = {
      params: {
        subreddit: 'nonExistentSubreddit'
      },
      decoded: {
        username: 'testUser'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = null

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)

    await muteCommunity(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'nonExistentSubreddit', isDeleted: false })
    expect(UserModel.findOne).not.toHaveBeenCalled()
    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Community not found'
    })
  })
})

describe('getReportedPosts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should return a list of reported posts when a valid subreddit is provided', async () => {
    const req = {
      params: {
        communityName: 'subreddit'
      },
      query: {},
      decoded: {
        username: 'testUser'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'subreddit',
      isDeleted: false
    }

    const posts = [
      {
        title: 'Post 1',
        communityName: 'subreddit',
        isDeleted: false,
        isRemoved: false,
        type: 'Post',
        pollOptions: [],
        expirationDate: null,
        isNsfw: false
      },
      {
        title: 'Comment 1',
        communityName: 'subreddit',
        isDeleted: false,
        isRemoved: false,
        pollOptions: [],
        expirationDate: null,
        type: 'Comment',
        isNsfw: false
      }
    ]

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
    PostModel.getReportedPosts = jest.fn().mockResolvedValue(posts)

    await getReportedPosts(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'subreddit', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser', isDeleted: false })
    expect(PostModel.getReportedPosts).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(
      [
        {
          title: 'Post 1',
          communityName: 'subreddit',
          isDeleted: false,
          isRemoved: false,
          isUpvoted: false,
          isDownvoted: false,
          isSaved: false,
          isHidden: false,
          type: 'Post',
          isNSFW: false
        },
        {
          title: 'Comment 1',
          communityName: 'subreddit',
          isDeleted: false,
          isRemoved: false,
          isUpvoted: false,
          isDownvoted: false,
          isSaved: false,
          isHidden: false,
          type: 'Comment',
          isNSFW: false
        }
      ]
    )
  })

  test('should return an empty list when there are no reported posts', async () => {
    const req = {
      params: {
        communityName: 'subreddit'
      },
      query: {},
      decoded: {
        username: 'testUser'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'subreddit',
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
    PostModel.getReportedPosts = jest.fn().mockResolvedValue([])

    await getReportedPosts(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'subreddit', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser', isDeleted: false })
    expect(PostModel.getReportedPosts).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith([])
  })

  test('should return 400 if subreddit is not provided', async () => {
    const req = {
      params: {},
      query: {}
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    await getReportedPosts(req, res)

    expect(UserModel.findOne).not.toHaveBeenCalled()
    expect(CommunityModel.findOne).not.toHaveBeenCalled()
    expect(PostModel.getReportedPosts).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Subreddit is required'
    })
  })

  test('should return a 404 error when the community is not found', async () => {
    const req = {
      params: {
        communityName: 'nonexistentCommunity'
      },
      query: {}
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(null)

    await getReportedPosts(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'nonexistentCommunity', isDeleted: false })
    expect(UserModel.findOne).not.toHaveBeenCalled()
    expect(PostModel.getReportedPosts).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Community not found'
    })
  })

  test('should return a 404 error if the user does not exist', async () => {
    const req = {
      params: {
        communityName: 'subreddit'
      },
      query: {},
      decoded: {
        username: 'nonexistentuser'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'subreddit',
      isDeleted: false
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValue(null)

    await getReportedPosts(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'subreddit', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'nonexistentuser', isDeleted: false })
    expect(PostModel.getReportedPosts).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      message: 'User does not exist'
    })
  })
})

describe('getCommunityRules', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should return the rules of a valid community when given a valid subreddit parameter', async () => {
    const req = {
      params: {
        communityName: 'validSubreddit'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'validSubreddit',
      rules: [
        {
          text: 'Rule 1',
          appliesTo: 'Posts & comments'
        },
        {
          text: 'Rule 2',
          appliesTo: 'Posts only'
        }
      ]
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)

    await getCommunityRules(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'validSubreddit', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(community.rules)
  })

  test('should return a 400 error message when given an empty subreddit parameter', async () => {
    const req = {
      params: {}
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    await getCommunityRules(req, res)

    expect(CommunityModel.findOne).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Subreddit is required'
    })
  })

  test('should return a 404 error message when given a non-existent subreddit parameter', async () => {
    const req = {
      params: {
        communityName: 'nonExistentSubreddit'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(null)

    await getCommunityRules(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'nonExistentSubreddit', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Community not found'
    })
  })
})

describe('updateCommunityRules', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should update community rules when valid rules are provided', async () => {
    const req = {
      params: {
        communityName: 'subreddit'
      },
      body: {
        rules: [
          {
            text: 'Rule 1',
            appliesTo: 'Posts & comments'
          },
          {
            text: 'Rule 2',
            appliesTo: 'Posts only'
          }
        ]
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const oldCommunity = {
      name: 'subreddit',
      rules: [
        {
          text: 'Old rule',
          appliesTo: 'Posts & comments'
        }
      ],
      save: jest.fn()
    }

    const newCommunity = {
      name: 'subreddit',
      rules: [
        {
          text: 'Rule 1',
          appliesTo: 'Posts & comments'
        },
        {
          text: 'Rule 2',
          appliesTo: 'Posts only'
        }
      ]
    }

    CommunityModel.findOne = jest.fn().mockResolvedValueOnce(oldCommunity).mockResolvedValueOnce(newCommunity)

    await updateCommunityRules(req, res)

    expect(CommunityModel.findOne).toHaveBeenNthCalledWith(1, { name: 'subreddit', isDeleted: false })
    expect(CommunityModel.findOne).toHaveBeenNthCalledWith(2, { name: 'subreddit', isDeleted: false })
    expect(CommunityModel.findOne).toHaveBeenCalledTimes(2)
    expect(oldCommunity.save).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(req.body.rules)
  })

  test('should return 400 when rules are not provided', () => {
    const req = {
      params: {
        communityName: 'subreddit'
      },
      body: {}
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    updateCommunityRules(req, res)

    expect(CommunityModel.findOne).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Rules are required'
    })
  })

  test('should return 400 when communityName is not provided', () => {
    const req = {
      params: {},
      body: {
        rules: [
          {
            text: 'Rule 1',
            appliesTo: 'Posts & comments'
          },
          {
            text: 'Rule 2',
            appliesTo: 'Posts only'
          }
        ]
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    updateCommunityRules(req, res)

    expect(CommunityModel.findOne).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Subreddit is required'
    })
  })

  test('should return 404 when community is not found', async () => {
    const req = {
      params: {
        communityName: 'nonexistentCommunity'
      },
      body: {
        rules: [
          {
            text: 'Rule 1',
            appliesTo: 'Posts & comments'
          },
          {
            text: 'Rule 2',
            appliesTo: 'Posts only'
          }
        ]
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(null)

    await updateCommunityRules(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'nonexistentCommunity', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Community not found'
    })
  })
})

describe('getCommunitySettings', () => {
  test('should return the community settings for a valid subreddit', async () => {
    const req = {
      params: {
        communityName: 'validSubreddit'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'validSubreddit',
      settings: {
        allowedPostTypes: 'Posts',
        allowCrossPosting: true,
        allowSpoiler: true,
        allowImages: true,
        allowPolls: true,
        suggestedSort: 'old',
        allowImageComments: false
      }
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)

    await getCommunitySettings(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'validSubreddit', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(community.settings)
  })

  test('should return a 400 error when subreddit is not provided', async () => {
    const req = {
      params: {}
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    await getCommunitySettings(req, res)

    expect(CommunityModel).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Subreddit is required'
    })
  })

  test('should return a 404 error when the subreddit is not found', async () => {
    const req = {
      params: {
        communityName: 'nonExistentSubreddit'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(null)

    await getCommunitySettings(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'nonExistentSubreddit', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Community not found'
    })
  })
})

describe('updateCommunitySettings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should update community settings with valid subreddit and settings', async () => {
    const req = {
      params: {
        communityName: 'subreddit'
      },
      body: {
        settings: {
          allowedPostTypes: 'Posts',
          allowCrossPosting: true,
          allowSpoiler: false,
          allowImages: true,
          allowPolls: false,
          suggestedSort: 'new',
          allowImageComments: true
        }
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const oldCommunity = {
      name: 'subreddit',
      settings: {
        allowedPostTypes: 'Links',
        allowCrossPosting: true,
        allowSpoiler: true,
        allowImages: true,
        allowPolls: true,
        suggestedSort: 'old',
        allowImageComments: false
      },
      save: jest.fn()
    }

    const newCommunity = {
      name: 'subreddit',
      settings: {
        allowedPostTypes: 'Posts',
        allowCrossPosting: true,
        allowSpoiler: false,
        allowImages: true,
        allowPolls: false,
        suggestedSort: 'new',
        allowImageComments: true
      }
    }

    CommunityModel.findOne = jest.fn().mockResolvedValueOnce(oldCommunity).mockResolvedValueOnce(newCommunity)

    await updateCommunitySettings(req, res)

    expect(CommunityModel.findOne).toHaveBeenNthCalledWith(1, { name: 'subreddit', isDeleted: false })
    expect(CommunityModel.findOne).toHaveBeenNthCalledWith(2, { name: 'subreddit', isDeleted: false })
    expect(CommunityModel.findOne).toHaveBeenCalledTimes(2)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(newCommunity.settings)
  })

  test('should update community settings with valid subreddit and partial settings', async () => {
    const req = {
      params: {
        communityName: 'subreddit'
      },
      body: {
        settings: {
          allowCrossPosting: true,
          allowSpoiler: false,
          allowImageComments: true
        }
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const oldCommunity = {
      name: 'subreddit',
      settings: {
        allowedPostTypes: 'Links',
        allowCrossPosting: false,
        allowSpoiler: true,
        allowImages: true,
        allowPolls: true,
        suggestedSort: 'old',
        allowImageComments: false
      },
      save: jest.fn()
    }

    const newCommunity = {
      name: 'subreddit',
      settings: {
        allowedPostTypes: 'Links',
        allowCrossPosting: true,
        allowSpoiler: false,
        allowImages: true,
        allowPolls: true,
        suggestedSort: 'old',
        allowImageComments: true
      }
    }

    CommunityModel.findOne = jest.fn().mockResolvedValueOnce(oldCommunity).mockResolvedValueOnce(newCommunity)

    await updateCommunitySettings(req, res)

    expect(CommunityModel.findOne).toHaveBeenNthCalledWith(1, { name: 'subreddit', isDeleted: false })
    expect(CommunityModel.findOne).toHaveBeenNthCalledWith(2, { name: 'subreddit', isDeleted: false })
    expect(CommunityModel.findOne).toHaveBeenCalledTimes(2)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(newCommunity.settings)
  })

  test('should not change community settings when settings are empty', async () => {
    const req = {
      params: {
        communityName: 'subreddit'
      },
      body: {
        settings: {}
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'subreddit',
      settings: {
        allowedPostTypes: 'Any',
        allowCrossPosting: false,
        allowSpoiler: false,
        allowImages: true,
        allowPolls: false,
        suggestedSort: 'top',
        allowImageComments: false
      },
      save: jest.fn()
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)

    await updateCommunitySettings(req, res)

    expect(CommunityModel.findOne).toHaveBeenNthCalledWith(1, { name: 'subreddit', isDeleted: false })
    expect(CommunityModel.findOne).toHaveBeenNthCalledWith(2, { name: 'subreddit', isDeleted: false })
    expect(CommunityModel.findOne).toHaveBeenCalledTimes(2)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(community.settings)
  })

  test('should return 400 if settings are not provided', async () => {
    const req = {
      params: {
        communityName: 'subreddit'
      },
      body: {}
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    await updateCommunitySettings(req, res)

    expect(CommunityModel.findOne).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Settings are required'
    })
  })

  test('should return 400 if subreddit is not provided', async () => {
    const req = {
      params: {},
      body: {
        settings: {
          allowedPostTypes: 'Posts',
          allowCrossPosting: true,
          allowSpoiler: false,
          allowImages: true,
          allowPolls: false,
          suggestedSort: 'new',
          allowImageComments: true
        }
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    await updateCommunitySettings(req, res)

    expect(CommunityModel.findOne).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Subreddit is required'
    })
  })

  test('should return 404 if community is not found', async () => {
    const req = {
      params: {
        communityName: 'nonexistent'
      },
      body: {
        settings: {
          allowedPostTypes: 'Any',
          allowCrossPosting: true,
          allowSpoiler: false,
          allowImages: true,
          allowPolls: false,
          suggestedSort: 'new',
          allowImageComments: true
        }
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(null)

    await updateCommunitySettings(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'nonexistent', isDeleted: false })
    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Community not found'
    })
  })
})

describe('getScheduledPosts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should return scheduled posts for a valid community and user with default pagination', async () => {
    const req = {
      params: {
        communityName: 'validCommunity'
      },
      decoded: {
        username: 'validUser'
      },
      query: {}
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'validCommunity',
      isDeleted: false
    }

    const user = {
      username: 'validUser',
      isDeleted: false
    }

    const scheduledPosts = [
      { title: 'Post 1', content: 'Content 1' },
      { title: 'Post 2', content: 'Content 2' }
    ]

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValue(user)
    PostModel.getScheduledPosts = jest.fn().mockResolvedValue(scheduledPosts)

    await getScheduledPosts(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'validCommunity', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'validUser', isDeleted: false })
    expect(PostModel.getScheduledPosts).toHaveBeenCalledWith('validCommunity', { page: 0, limit: 10 })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(scheduledPosts)
  })

  test('should return scheduled posts for a valid community and user with custom pagination', async () => {
    const req = {
      params: {
        communityName: 'validCommunity'
      },
      decoded: {
        username: 'validUser'
      },
      query: {
        page: 2,
        limit: 5
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'validCommunity',
      isDeleted: false
    }

    const user = {
      username: 'validUser',
      isDeleted: false
    }

    const scheduledPosts = [
      { title: 'Post 1', content: 'Content 1' },
      { title: 'Post 2', content: 'Content 2' }
    ]

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValue(user)
    PostModel.getScheduledPosts = jest.fn().mockResolvedValue(scheduledPosts)

    await getScheduledPosts(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'validCommunity', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'validUser', isDeleted: false })
    expect(PostModel.getScheduledPosts).toHaveBeenCalledWith('validCommunity', { page: 1, limit: 5 })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(scheduledPosts)
  })

  test('should return an empty array when there are no scheduled posts for a community', async () => {
    const req = {
      params: {
        communityName: 'validCommunity'
      },
      decoded: {
        username: 'validUser'
      },
      query: {}
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'validCommunity',
      isDeleted: false
    }

    const user = {
      username: 'validUser',
      isDeleted: false
    }

    const scheduledPosts = []

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValue(user)
    PostModel.getScheduledPosts = jest.fn().mockResolvedValue(scheduledPosts)

    await getScheduledPosts(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'validCommunity', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'validUser', isDeleted: false })
    expect(PostModel.getScheduledPosts).toHaveBeenCalledWith('validCommunity', { page: 0, limit: 10 })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(scheduledPosts)
  })

  test('should return 400 when subreddit is not provided', async () => {
    const req = {
      params: {},
      decoded: {
        username: 'validUser'
      },
      query: {}
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    await getScheduledPosts(req, res)

    expect(CommunityModel.findOne).not.toHaveBeenCalled()
    expect(UserModel.findOne).not.toHaveBeenCalled()
    expect(PostModel.getScheduledPosts).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Subreddit is required' })
  })

  test('should return 404 when community is not found', async () => {
    const req = {
      params: {
        communityName: 'nonexistentCommunity'
      },
      decoded: {
        username: 'validUser'
      },
      query: {}
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = null

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)

    await getScheduledPosts(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'nonexistentCommunity', isDeleted: false })
    expect(UserModel.findOne).not.toHaveBeenCalled()
    expect(PostModel.getScheduledPosts).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Community not found'
    })
  })

  test('should return 404 when user is not found', async () => {
    const req = {
      params: {
        communityName: 'validCommunity'
      },
      decoded: {
        username: 'nonExistingUser'
      },
      query: {}
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'validCommunity',
      isDeleted: false
    }

    const user = null

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValue(user)

    await getScheduledPosts(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'validCommunity', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'nonExistingUser', isDeleted: false })
    expect(PostModel.getScheduledPosts).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      message: 'User does not exist'
    })
  })
})

describe('getUnmoderatedPosts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should return unmoderated posts for a valid community and user', async () => {
    const req = {
      params: {
        communityName: 'validCommunity'
      },
      decoded: {
        username: 'validUser'
      },
      query: {}
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'validCommunity',
      isDeleted: false
    }

    const user = {
      username: 'validUser',
      isDeleted: false,
      upvotedPosts: [],
      downvotedPosts: [],
      savedPosts: [],
      hiddenPosts: []
    }

    const post = {
      type: 'Text',
      pollOptions: [],
      isNsfw: false,
      _id: 'postId'
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValue(user)
    PostModel.getUnmoderatedPosts = jest.fn().mockResolvedValue([post])

    await getUnmoderatedPosts(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(UserModel.findOne).toHaveBeenCalledTimes(1)
    expect(PostModel.getUnmoderatedPosts).toHaveBeenCalledTimes(1)
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'validCommunity', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'validUser', isDeleted: false })
    expect(PostModel.getUnmoderatedPosts).toHaveBeenCalledWith('validCommunity', { page: 0, limit: 10, sortMethod: { createdAt: -1, _id: -1 } })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith([{
      type: 'Text',
      isNSFW: false,
      _id: 'postId',
      isUpvoted: false,
      isDownvoted: false,
      isSaved: false,
      isHidden: false
    }])
  })

  test('should return an empty array if there are no unmoderated posts', async () => {
    const req = {
      params: {
        communityName: 'validCommunity'
      },
      decoded: {
        username: 'validUser'
      },
      query: {}
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'validCommunity',
      isDeleted: false
    }

    const user = {
      username: 'validUser',
      isDeleted: false,
      upvotedPosts: [],
      downvotedPosts: [],
      savedPosts: [],
      hiddenPosts: []
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValue(user)
    PostModel.getUnmoderatedPosts = jest.fn().mockResolvedValue([])

    await getUnmoderatedPosts(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(UserModel.findOne).toHaveBeenCalledTimes(1)
    expect(PostModel.getUnmoderatedPosts).toHaveBeenCalledTimes(1)
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'validCommunity', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'validUser', isDeleted: false })
    expect(PostModel.getUnmoderatedPosts).toHaveBeenCalledWith('validCommunity', { page: 0, limit: 10, sortMethod: { createdAt: -1, _id: -1 } })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith([])
  })

  test('should return 400 if subreddit is not provided', async () => {
    const req = {
      params: {},
      decoded: {
        username: 'validUser'
      },
      query: {}
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    await getUnmoderatedPosts(req, res)

    expect(CommunityModel.findOne).not.toHaveBeenCalled()
    expect(UserModel.findOne).not.toHaveBeenCalled()
    expect(PostModel.getUnmoderatedPosts).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Subreddit is required'
    })
  })

  test('should return 404 if community is not found', async () => {
    const req = {
      params: {
        communityName: 'nonExistentCommunity'
      },
      decoded: {
        username: 'validUser'
      },
      query: {}
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(null)

    await getUnmoderatedPosts(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'nonExistentCommunity', isDeleted: false })
    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(UserModel.findOne).not.toHaveBeenCalled()
    expect(PostModel.getUnmoderatedPosts).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Community not found'
    })
  })

  test('should return 404 if user is not found', async () => {
    const req = {
      params: {
        communityName: 'validCommunity'
      },
      decoded: {
        username: 'nonexistentUser'
      },
      query: {}
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'validCommunity',
      isDeleted: false
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    UserModel.findOne = jest.fn().mockResolvedValue(null)

    await getUnmoderatedPosts(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(UserModel.findOne).toHaveBeenCalledTimes(1)
    expect(PostModel.getUnmoderatedPosts).not.toHaveBeenCalled()
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'validCommunity', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'nonexistentUser', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      message: 'User does not exist'
    })
  })
})

describe('updateCommunityBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should successfully update community banner when valid community name and image file are provided', async () => {
    const req = {
      params: {
        communityName: 'testCommunity'
      },
      files: {
        image: 'testImage'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'testCommunity',
      isDeleted: false,
      banner: 'oldBanner',
      save: jest.fn()
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    MediaUtils.deleteImages = jest.fn().mockResolvedValue()
    MediaUtils.uploadImages = jest.fn().mockResolvedValue(['newBanner'])

    await updateCommunityBanner(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testCommunity', isDeleted: false })
    expect(MediaUtils.deleteImages).toHaveBeenCalledWith(['oldBanner'])
    expect(MediaUtils.uploadImages).toHaveBeenCalledWith('testImage')
    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(MediaUtils.deleteImages).toHaveBeenCalledTimes(1)
    expect(MediaUtils.uploadImages).toHaveBeenCalledTimes(1)
    expect(community.save).toHaveBeenCalledTimes(1)
    expect(community.banner).toBe('newBanner')
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ link: 'newBanner' })
  })

  test('should successfully update community banner when valid community name and image file are provided', async () => {
    const req = {
      params: {
        communityName: 'testCommunity'
      },
      files: {
        image: 'testImage'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'testCommunity',
      isDeleted: false,
      save: jest.fn()
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    MediaUtils.deleteImages = jest.fn().mockResolvedValue()
    MediaUtils.uploadImages = jest.fn().mockResolvedValue(['newBanner'])

    await updateCommunityBanner(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testCommunity', isDeleted: false })
    expect(MediaUtils.deleteImages).toHaveBeenCalledWith([])
    expect(MediaUtils.uploadImages).toHaveBeenCalledWith('testImage')
    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(MediaUtils.deleteImages).toHaveBeenCalledTimes(1)
    expect(MediaUtils.uploadImages).toHaveBeenCalledTimes(1)
    expect(community.banner).toBe('newBanner')
    expect(community.save).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ link: 'newBanner' })
  })

  test('should return error response with message when banner is not provided', async () => {
    const req = {
      params: {
        communityName: 'testCommunity'
      },
      files: {}
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    await updateCommunityBanner(req, res)

    expect(CommunityModel.findOne).not.toHaveBeenCalled()
    expect(MediaUtils.deleteImages).not.toHaveBeenCalled()
    expect(MediaUtils.uploadImages).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Banner is required' })
  })

  test('should return error response with message when files are not provided', async () => {
    const req = {
      params: {
        communityName: 'testCommunity'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    await updateCommunityBanner(req, res)

    expect(CommunityModel.findOne).not.toHaveBeenCalled()
    expect(MediaUtils.deleteImages).not.toHaveBeenCalled()
    expect(MediaUtils.uploadImages).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Banner is required' })
  })

  test('should return error response with message when community name is not provided', async () => {
    const req = {
      params: {},
      files: {
        image: 'testImage'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    await updateCommunityBanner(req, res)

    expect(CommunityModel.findOne).not.toHaveBeenCalled()
    expect(MediaUtils.deleteImages).not.toHaveBeenCalled()
    expect(MediaUtils.uploadImages).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Community name is required' })
  })

  it('should return error response with message when community is not found', async () => {
    const req = {
      params: {
        communityName: 'nonExistentCommunity'
      },
      files: {
        image: 'testImage'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = null
    CommunityModel.findOne = jest.fn().mockResolvedValue(community)

    await updateCommunityBanner(req, res)

    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'nonExistentCommunity', isDeleted: false })
    expect(MediaUtils.deleteImages).not.toHaveBeenCalled()
    expect(MediaUtils.uploadImages).not.toHaveBeenCalled()
    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ message: 'Community not found' })
  })
})
