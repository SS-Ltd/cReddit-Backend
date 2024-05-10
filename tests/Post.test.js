const PostController = require('../src/controllers/Post')
const CommunityModel = require('../src/models/Community')
const PostModel = require('../src/models/Post')
const UserModel = require('../src/models/User')
const HistoryModel = require('../src/models/History')
const schedule = require('node-schedule')
const MediaUtils = require('../src/utils/Media')
const PostUtils = require('../src/utils/Post')
const { getPost, getHomeFeed, getComments, reportPost } = require('../src/controllers/Post')
const { ObjectId } = require('mongodb')

jest.mock('../src/models/Post', () => {
  return jest.fn().mockImplementation(() => {
    return {
      save: jest.fn(),
      deleteOne: jest.fn(),
      getPost: jest.fn(),
      findOneAndUpdate: jest.fn(),
      getRandomHomeFeed: jest.fn(),
      getSortedHomeFeed: jest.fn()
    }
  })
})

jest.mock('../src/models/Community', () => {
  return {
    findOne: jest.fn()
  }
})

jest.mock('../src/models/User', () => {
  return {
    findOne: jest.fn()
  }
})

jest.mock('../src/models/History', () => {
  return {
    findOne: jest.fn(),
    create: jest.fn()
  }
})

describe('createPost', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should create a post of type "Post" with required fields', async () => {
    const req = {
      decoded: { username: 'Test User' },
      body: {
        type: 'Post',
        communityName: 'Test Community',
        title: 'Test Title'
      },
      files: []
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'Test Community',
      type: 'public',
      settings: {
        allowedPostTypes: 'Posts',
        allowCrossPosting: true,
        allowSpoiler: false,
        allowImages: true,
        allowPolls: false,
        suggestedSort: 'new',
        allowImageComments: true
      },
      isNSFW: false,
      moderators: [],
      bannedUsers: []
    }

    UserModel.findOne = jest.fn().mockResolvedValue({ username: 'Test User', upvotedPosts: [], downvotedPosts: [], save: jest.fn() })
    CommunityModel.findOne = jest.fn().mockResolvedValue(community)

    await PostController.createPost(req, res)

    expect(PostModel).toHaveBeenCalledWith({
      type: 'Post',
      username: 'Test User',
      communityName: 'Test Community',
      title: 'Test Title',
      content: '',
      pollOptions: [],
      expirationDate: null,
      isSpoiler: false,
      isNsfw: false,
      upvotedPosts: [],
      downvotedPosts: [],
      child: null,
      createdAt: expect.any(Date)
    })
    expect(res.json).toHaveBeenCalledWith({ message: 'Post created successfully' })
    expect(res.status).toHaveBeenCalledWith(201)
  })

  test('should create a post of type "Images & Video" with required fields', async () => {
    const req = {
      decoded: { username: 'Test User' },
      body: {
        type: 'Images & Video',
        communityName: null,
        title: 'Test Title'
      },
      files: [
        { buffer: Buffer.from('file1') },
        { buffer: Buffer.from('file2') },
        { buffer: Buffer.from('file3') },
        { buffer: Buffer.from('file4') },
        { buffer: Buffer.from('file5') }
      ]
    }

    UserModel.findOne = jest.fn().mockResolvedValue({ username: 'Test User', upvotedPosts: [], downvotedPosts: [], save: jest.fn(), preferences: { isNSFW: false } })
    MediaUtils.cloudinary.uploader.upload = jest.fn().mockResolvedValue({ secure_url: 'secure_url' })

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    await PostController.createPost(req, res)

    expect(MediaUtils.cloudinary.uploader.upload).toHaveBeenCalledTimes(5)
    expect(PostModel).toHaveBeenCalledWith({
      type: 'Images & Video',
      username: 'Test User',
      communityName: null,
      title: 'Test Title',
      content: 'secure_url secure_url secure_url secure_url secure_url',
      pollOptions: [],
      expirationDate: null,
      isSpoiler: false,
      isNsfw: false,
      upvotedPosts: [],
      downvotedPosts: [],
      child: null,
      createdAt: expect.any(Date)
    })
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith({ message: 'Post created successfully' })
  })

  test('should create a post of type "Link" with required fields', async () => {
    const req = {
      decoded: { username: 'Test User' },
      body: {
        type: 'Link',
        communityName: null,
        title: 'Test Title',
        content: 'https://www.example.com',
        isSpoiler: true
      },
      files: []
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    UserModel.findOne = jest.fn().mockResolvedValue({ username: 'Test User', upvotedPosts: [], downvotedPosts: [], save: jest.fn(), preferences: { isNSFW: false } })

    await PostController.createPost(req, res)

    expect(PostModel).toHaveBeenCalledWith({
      type: 'Link',
      username: 'Test User',
      communityName: null,
      title: 'Test Title',
      content: 'https://www.example.com',
      pollOptions: [],
      expirationDate: null,
      isSpoiler: true,
      isNsfw: false,
      upvotedPosts: [],
      downvotedPosts: [],
      child: null,
      createdAt: expect.any(Date)
    })
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith({ message: 'Post created successfully' })
  })

  test('should create a post of type "Poll" with required fields', async () => {
    const req = {
      decoded: { username: 'Test User' },
      body: {
        type: 'Poll',
        communityName: 'Test Community',
        title: 'Test Title',
        content: 'https://www.example.com',
        pollOptions: ['Option 1', 'Option 2'],
        expirationDate: '2080-12-31T23:59:59.999Z',
        isNSFW: true
      },
      files: []
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'Test Community',
      type: 'public',
      settings: {
        allowedPostTypes: 'Any',
        allowCrossPosting: true,
        allowSpoiler: false,
        allowImages: true,
        allowPolls: true,
        suggestedSort: 'new',
        allowImageComments: true
      },
      isNSFW: false,
      moderators: [],
      bannedUsers: []
    }

    UserModel.findOne = jest.fn().mockResolvedValue({ username: 'Test User', upvotedPosts: [], downvotedPosts: [], save: jest.fn() })
    CommunityModel.findOne = jest.fn().mockResolvedValue(community)

    await PostController.createPost(req, res)

    expect(PostModel).toHaveBeenCalledWith({
      type: 'Poll',
      username: 'Test User',
      communityName: 'Test Community',
      title: 'Test Title',
      content: 'https://www.example.com',
      pollOptions: ['Option 1', 'Option 2'].map(option => ({ text: option, votes: 0 })),
      expirationDate: '2080-12-31T23:59:59.999Z',
      isSpoiler: false,
      isNsfw: true,
      upvotedPosts: [],
      downvotedPosts: [],
      child: null,
      createdAt: expect.any(Date)
    })
    expect(res.json).toHaveBeenCalledWith({ message: 'Post created successfully' })
    expect(res.status).toHaveBeenCalledWith(201)
  })

  test('should create a post with additional fields and send back warning', async () => {
    const req = {
      decoded: { username: 'Test User' },
      body: {
        type: 'Post',
        communityName: 'Test Community',
        title: 'Test Title',
        content: 'https://www.example.com',
        expirationDate: '2022-12-31T23:59:59.999Z',
        isNSFW: true
      },
      files: []
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'Test Community',
      type: 'public',
      settings: {
        allowedPostTypes: 'Posts',
        allowCrossPosting: true,
        allowSpoiler: false,
        allowImages: true,
        allowPolls: false,
        suggestedSort: 'new',
        allowImageComments: true
      },
      isNSFW: true,
      moderators: [],
      bannedUsers: []
    }

    UserModel.findOne = jest.fn().mockResolvedValue({ username: 'Test User', upvotedPosts: [], downvotedPosts: [], save: jest.fn() })
    CommunityModel.findOne = jest.fn().mockResolvedValue(community)

    await PostController.createPost(req, res)

    expect(PostModel).toHaveBeenCalledWith({
      type: 'Post',
      username: 'Test User',
      communityName: 'Test Community',
      title: 'Test Title',
      content: 'https://www.example.com',
      pollOptions: [],
      expirationDate: null,
      isSpoiler: false,
      isNsfw: true,
      upvotedPosts: [],
      downvotedPosts: [],
      child: null,
      createdAt: expect.any(Date)
    })
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith({ message: 'Post created successfully while ignoring additional fields' })
  })

  test('should not create a post of type "Poll" with missing pollOption field', async () => {
    const req = {
      decoded: { username: 'Test User' },
      body: {
        type: 'Poll',
        communityName: 'Test Community',
        title: 'Test Title',
        content: 'https://www.example.com',
        expirationDate: '2022-12-31T23:59:59.999Z',
        isNSFW: true
      },
      files: []
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    await PostController.createPost(req, res)

    expect(PostModel).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Poll options must be an array' })
  })

  test('should not create a post of type "Poll" with an expiration date that has passed', async () => {
    const req = {
      decoded: { username: 'Test User' },
      body: {
        type: 'Poll',
        communityName: 'Test Community',
        title: 'Test Title',
        content: 'https://www.example.com',
        pollOptions: ['Option 1', 'Option 2'],
        expirationDate: '2022-12-31T23:59:59.999Z',
        isNSFW: true
      },
      files: []
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    await PostController.createPost(req, res)

    expect(PostModel).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid expiration date' })
  })

  test('should not create a post of type "Link" with invalid URL field', async () => {
    const req = {
      decoded: { username: 'Test User' },
      body: {
        type: 'Link',
        communityName: 'Test Community',
        title: 'Test Title',
        content: 'example',
        expirationDate: '2022-12-31T23:59:59.999Z',
        isNSFW: true
      },
      files: []
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    await PostController.createPost(req, res)

    expect(PostModel).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid URL' })
  })

  test('should not create a post of type "Images & Video" with missing files', async () => {
    const req = {
      decoded: { username: 'Test User' },
      body: {
        type: 'Images & Video',
        communityName: 'Test Community',
        title: 'Test Title',
        content: 'https://www.example.com',
        expirationDate: '2022-12-31T23:59:59.999Z',
        isNSFW: true
      },
      files: []
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    await PostController.createPost(req, res)

    expect(PostModel).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Images or video are required' })
  })

  test('should not create a post of invalid type', async () => {
    const req = {
      decoded: { username: 'Test User' },
      body: {
        type: 'test type',
        communityName: 'Test Community',
        title: 'Test Title',
        content: 'https://www.example.com',
        expirationDate: '2022-12-31T23:59:59.999Z',
        isNSFW: true
      },
      files: []
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    await PostController.createPost(req, res)

    expect(PostModel).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid type' })
  })

  test('should not create a post of missing title', async () => {
    const req = {
      decoded: { username: 'Test User' },
      body: {
        type: 'Post',
        communityName: 'Test Community',
        content: 'https://www.example.com',
        expirationDate: '2022-12-31T23:59:59.999Z',
        isNSFW: true
      },
      files: []
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    await PostController.createPost(req, res)

    expect(PostModel).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Post type and title are required' })
  })

  test('should not create a post of non existing community', async () => {
    const req = {
      decoded: { username: 'Test User' },
      body: {
        type: 'Post',
        communityName: 'Non Existing Community',
        title: 'Test Title',
        content: 'https://www.example.com',
        expirationDate: '2022-12-31T23:59:59.999Z',
        isNSFW: true
      },
      files: []
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    CommunityModel.findOne = jest.fn().mockResolvedValue(null)

    await PostController.createPost(req, res)

    expect(PostModel).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Community does not exist' })
  })

  test('should not create a post of type Cross Post when child post is not provided', async () => {
    const req = {
      decoded: { username: 'Test User' },
      body: {
        type: 'Cross Post',
        communityName: 'Test Community',
        title: 'Test Title',
        content: 'https://www.example.com',
        expirationDate: '2022-12-31T23:59:59.999Z',
        isNSFW: true,
        postId: '65fcc9307932c5551dfd88e0'
      },
      files: []
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    PostModel.findOne = jest.fn().mockResolvedValue(null)

    await PostController.createPost(req, res)

    expect(PostModel).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Child post does not exist' })
  })

  test('should not create post if user is banned from the community', async () => {
    const req = {
      decoded: { username: 'Test User' },
      body: {
        type: 'Post',
        communityName: 'Test Community',
        title: 'Test Title',
        content: 'https://www.example.com',
        expirationDate: '2022-12-31T23:59:59.999Z',
        isNSFW: true,
        username: 'Test User'
      },
      files: []
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'Test Community',
      type: 'public',
      settings: {
        allowedPostTypes: 'Posts',
        allowCrossPosting: true,
        allowSpoiler: false,
        allowImages: true,
        allowPolls: false,
        suggestedSort: 'new',
        allowImageComments: true
      },
      isNSFW: false,
      moderators: [],
      bannedUsers: [{ name: 'Test User' }]
    }

    UserModel.findOne = jest.fn().mockResolvedValue({ username: 'Test User', upvotedPosts: [], downvotedPosts: [], save: jest.fn() })
    CommunityModel.findOne = jest.fn().mockResolvedValue(community)

    await PostController.createPost(req, res)

    expect(PostModel).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'You are banned from this community' })
  })

  test('should not create post if community type is not public and user is not a moderator or approved', async () => {
    const req = {
      decoded: { username: 'Test User' },
      body: {
        type: 'Post',
        communityName: 'Test Community',
        title: 'Test Title',
        content: 'https://www.example.com',
        expirationDate: '2022-12-31T23:59:59.999Z',
        isNSFW: true,
        username: 'Test User'
      },
      files: []
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'Test Community',
      type: 'private',
      settings: {
        allowedPostTypes: 'Posts',
        allowCrossPosting: true,
        allowSpoiler: false,
        allowImages: true,
        allowPolls: false,
        suggestedSort: 'new',
        allowImageComments: true
      },
      isNSFW: false,
      moderators: [],
      approvedUsers: [],
      bannedUsers: []
    }

    UserModel.findOne = jest.fn().mockResolvedValue({ username: 'Test User', upvotedPosts: [], downvotedPosts: [], save: jest.fn() })
    CommunityModel.findOne = jest.fn().mockResolvedValue(community)

    await PostController.createPost(req, res)

    expect(PostModel).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Only moderators and approved users can post in this community' })
  })

  test('should not schedule post if user is not a moderator', async () => {
    const req = {
      decoded: { username: 'Test User' },
      body: {
        type: 'Post',
        communityName: 'Test Community',
        title: 'Test Title',
        content: 'https://www.example.com',
        expirationDate: '2022-12-31T23:59:59.999Z',
        isNSFW: true,
        username: 'Test User',
        date: '2024-12-31T23:59:59.999Z'
      },
      files: []
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'Test Community',
      type: 'public',
      settings: {
        allowedPostTypes: 'Posts',
        allowCrossPosting: true,
        allowSpoiler: false,
        allowImages: true,
        allowPolls: false,
        suggestedSort: 'new',
        allowImageComments: true
      },
      isNSFW: false,
      moderators: [],
      bannedUsers: []
    }

    UserModel.findOne = jest.fn().mockResolvedValue({ username: 'Test User', upvotedPosts: [], downvotedPosts: [], save: jest.fn() })
    CommunityModel.findOne = jest.fn().mockResolvedValue(community)

    await PostController.createPost(req, res)

    expect(PostModel).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Only moderators can schedule posts' })
  })

  test('shoud throw error is user is not found', async () => {
    const req = {
      decoded: { username: 'Test User' },
      body: {
        type: 'Post',
        communityName: 'Test Community',
        title: 'Test Title',
        content: 'https://www.example.com',
        expirationDate: '2022-12-31T23:59:59.999Z',
        isNSFW: true,
        username: 'Test User'
      },
      files: []
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    UserModel.findOne = jest.fn().mockResolvedValue(null)

    await PostController.createPost(req, res)

    expect(PostModel).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'User does not exist' })
  })

  test('should schedule post successfully', async () => {
    const req = {
      decoded: { username: 'Test User' },
      body: {
        type: 'Post',
        communityName: 'Test Community',
        title: 'Test Title',
        content: 'https://www.example.com',
        isNSFW: true,
        username: 'Test User',
        date: '2024-12-31T23:59:59.999Z'
      },
      files: []
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const community = {
      name: 'Test Community',
      type: 'public',
      settings: {
        allowedPostTypes: 'Posts',
        allowCrossPosting: true,
        allowSpoiler: false,
        allowImages: true,
        allowPolls: false,
        suggestedSort: 'new',
        allowImageComments: true
      },
      isNSFW: false,
      moderators: ['Test User'],
      bannedUsers: []
    }

    UserModel.findOne = jest.fn().mockResolvedValue({ username: 'Test User', upvotedPosts: [], downvotedPosts: [], save: jest.fn() })
    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    schedule.scheduleJob = jest.fn().mockResolvedValue({ name: 'job' })

    await PostController.createPost(req, res)

    expect(PostModel).toHaveBeenCalledWith({
      type: 'Post',
      username: 'Test User',
      communityName: 'Test Community',
      title: 'Test Title',
      content: 'https://www.example.com',
      pollOptions: [],
      expirationDate: null,
      isSpoiler: false,
      isNsfw: true,
      upvotedPosts: [],
      downvotedPosts: [],
      child: null,
      createdAt: '2024-12-31T23:59:59.999Z'
    })
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith({ message: 'Post created successfully' })
  })
})

describe('deletePost', () => {
  test('should delete a post successfully when valid post id and authorized user', async () => {
    const req = {
      params: {
        postId: '65fcc9307932c5551dfd88e0'
      },
      decoded: {
        username: 'authorizedUser'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    const post = {
      _id: '65fcc9307932c5551dfd88e0',
      username: 'authorizedUser',
      type: 'Images & Video',
      content: 'cReddit/image1.jpg cReddit/video1.mp4',
      isDeleted: false,
      save: jest.fn()
    }
    MediaUtils.cloudinary.uploader.destroy = jest.fn()
    PostModel.findOne = jest.fn().mockResolvedValue(post)

    await PostController.deletePost(req, res)

    expect(res.json).toHaveBeenCalledWith({ message: 'Post deleted successfully' })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(post.isDeleted).toBe(true)
    expect(PostModel.findOne).toHaveBeenCalledWith({ _id: '65fcc9307932c5551dfd88e0', isDeleted: false })
  })

  test('should not delete a post when unauthorized user', async () => {
    const req = {
      params: {
        postId: '65fcc9307932c5551dfd88e0'
      },
      decoded: {
        username: 'unauthorizedUser'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    const post = {
      _id: '65fcc9307932c5551dfd88e0',
      username: 'authorizedUser',
      type: 'Images & Video',
      content: 'cReddit/image1.jpg cReddit/video1.mp4',
      deleteOne: jest.fn()
    }
    MediaUtils.cloudinary.uploader.destroy = jest.fn()
    PostModel.findOne = jest.fn().mockResolvedValue(post)

    await PostController.deletePost(req, res)

    expect(res.json).toHaveBeenCalledWith({ message: 'You are not authorized to delete this post' })
    expect(res.status).toHaveBeenCalledWith(403)
    expect(PostModel.findOne).toHaveBeenCalledWith({ _id: '65fcc9307932c5551dfd88e0', isDeleted: false })
    expect(post.deleteOne).not.toHaveBeenCalled()
    expect(MediaUtils.cloudinary.uploader.destroy).not.toHaveBeenCalledWith('cReddit/image1')
    expect(MediaUtils.cloudinary.uploader.destroy).not.toHaveBeenCalledWith('cReddit/video1', { resource_type: 'video' })
  })

  test('should not delete a post when invalid post id', async () => {
    const req = {
      params: {
        postId: 'InvalidPostId'
      },
      decoded: {
        username: 'authorizedUser'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    const post = {
      _id: 'InvalidPostId',
      username: 'authorizedUser',
      type: 'Images & Video',
      content: 'cReddit/image1.jpg cReddit/video1.mp4',
      deleteOne: jest.fn()
    }
    MediaUtils.cloudinary.uploader.destroy = jest.fn()
    PostModel.findOne = jest.fn().mockResolvedValue(post)

    await PostController.deletePost(req, res)

    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid post id' })
    expect(res.status).toHaveBeenCalledWith(400)
    expect(PostModel.findOne).not.toHaveBeenCalledWith({ _id: 'InvalidPostId', isDeleted: false })
    expect(post.deleteOne).not.toHaveBeenCalled()
    expect(MediaUtils.cloudinary.uploader.destroy).not.toHaveBeenCalledWith('cReddit/image1')
    expect(MediaUtils.cloudinary.uploader.destroy).not.toHaveBeenCalledWith('cReddit/video1', { resource_type: 'video' })
  })

  test('should not delete a post when non-existing post id', async () => {
    const req = {
      params: {
        postId: '65fcc9307932c5551dfd88e0'
      },
      decoded: {
        username: 'authorizedUser'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    MediaUtils.cloudinary.uploader.destroy = jest.fn()
    PostModel.findOne = jest.fn().mockResolvedValue(null)

    await PostController.deletePost(req, res)

    expect(res.json).toHaveBeenCalledWith({ message: 'Post is not found' })
    expect(res.status).toHaveBeenCalledWith(400)
    expect(PostModel.findOne).toHaveBeenCalledWith({ _id: '65fcc9307932c5551dfd88e0', isDeleted: false })
    expect(MediaUtils.cloudinary.uploader.destroy).not.toHaveBeenCalledWith('cReddit/image1')
    expect(MediaUtils.cloudinary.uploader.destroy).not.toHaveBeenCalledWith('cReddit/video1', { resource_type: 'video' })
  })

  test('should throw server error when deleting post', async () => {
    const req = {
      params: {
        postId: '65fcc9307932c5551dfd88e0'
      },
      decoded: {
        username: 'authorizedUser'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    MediaUtils.cloudinary.uploader.destroy = jest.fn()
    PostModel.findOne = jest.fn().mockRejectedValue(new Error('Server error'))

    await PostController.deletePost(req, res)

    expect(res.json).toHaveBeenCalledWith({ message: 'Server error' })
    expect(res.status).toHaveBeenCalledWith(500)
    expect(PostModel.findOne).toHaveBeenCalledWith({ _id: '65fcc9307932c5551dfd88e0', isDeleted: false })
  })
})

describe('editPost', () => {
  test('should edit post successfully when given valid post ID, new content, and authorized user', async () => {
    const req = {
      params: {
        postId: '65fcc9307932c5551dfd88e0'
      },
      body: {
        newContent: 'new content'
      },
      decoded: {
        username: 'authorizedUser'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    const post = {
      _id: '65fcc9307932c5551dfd88e0',
      username: 'authorizedUser',
      type: 'Post',
      content: 'old content',
      isEdited: false,
      save: jest.fn()
    }
    PostModel.findOne = jest.fn().mockResolvedValue(post)

    await PostController.editPost(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: 'Post edited successfully' })
    expect(post.content).toBe('new content')
    expect(post.isEdited).toBe(true)
    expect(post.save).toHaveBeenCalled()
  })

  test('should return an error message when the post is not found', async () => {
    const req = {
      params: {
        postId: '65fcc9307932c5551dfd88e0'
      },
      body: {
        newContent: 'new content'
      },
      decoded: {
        username: 'authorizedUser'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    const post = null
    PostModel.findOne = jest.fn().mockResolvedValue(post)

    await PostController.editPost(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Post is not found' })
  })

  test('should return an error message when editing a post with valid post ID, new content, but unauthorized user', async () => {
    const req = {
      params: {
        postId: '65fcc9307932c5551dfd88e0'
      },
      body: {
        newContent: 'new content'
      },
      decoded: {
        username: 'unauthorizedUser'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    const post = {
      _id: '65fcc9307932c5551dfd88e0',
      username: 'authorizedUser',
      type: 'Post',
      content: 'old content',
      isEdited: false,
      save: jest.fn()
    }
    PostModel.findOne = jest.fn().mockResolvedValue(post)

    await PostController.editPost(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ message: 'You are not authorized to edit this post' })
    expect(post.content).toBe('old content')
    expect(post.isEdited).toBe(false)
    expect(post.save).not.toHaveBeenCalled()
  })

  test('should return an error message when editing a post of uneditable type', async () => {
    const req = {
      params: {
        postId: '65fcc9307932c5551dfd88e0'
      },
      body: {
        newContent: 'new content'
      },
      decoded: {
        username: 'authorizedUser'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    const post = {
      _id: '65fcc9307932c5551dfd88e0',
      username: 'authorizedUser',
      type: 'Images & Video',
      content: 'old content',
      isEdited: false,
      save: jest.fn()
    }
    PostModel.findOne = jest.fn().mockResolvedValue(post)

    await PostController.editPost(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'You cannot edit this post type' })
    expect(post.content).toBe('old content')
    expect(post.isEdited).toBe(false)
    expect(post.save).not.toHaveBeenCalled()
  })

  test('should return 400 status and error message when no new content is provided', async () => {
    const req = {
      params: {
        postId: '65fcc9307932c5551dfd88e0'
      },
      body: {},
      decoded: {
        username: 'authorizedUser'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    const post = {
      _id: '65fcc9307932c5551dfd88e0',
      username: 'authorizedUser',
      type: 'Post',
      content: 'old content',
      isEdited: false,
      save: jest.fn()
    }
    PostModel.findOne = jest.fn().mockResolvedValue(post)

    await PostController.editPost(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'No content to update' })
    expect(post.content).toBe('old content')
    expect(post.isEdited).toBe(false)
    expect(post.save).not.toHaveBeenCalled()
  })

  test('should return 400 when the post id is invalid', async () => {
    const req = {
      params: {
        postId: 'invalidPostId'
      },
      body: {
        newContent: 'new content'
      },
      decoded: {
        username: 'authorizedUser'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    PostModel.findOne = jest.fn()

    await PostController.editPost(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid post id' })
    expect(PostModel.findOne).not.toHaveBeenCalled()
  })

  test('should throw server error when editing post', async () => {
    const req = {
      params: {
        postId: '65fcc9307932c5551dfd88e0'
      },
      body: {
        newContent: 'new content'
      },
      decoded: {
        username: 'authorizedUser'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    PostModel.findOne = jest.fn().mockRejectedValue(new Error('Server error'))

    await PostController.editPost(req, res)

    expect(res.json).toHaveBeenCalledWith({ message: 'Server error' })
    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('markSpoiler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should allow marking post as spoiler for moderator or post owner', async () => {
    const req = {
      decoded: {
        username: 'testUser'
      },
      params: {
        postId: 'testPostId'
      },
      body: {
        isSpoiler: true
      }
    }

    const user = {
      username: 'testUser',
      isDeleted: false,
      moderatorInCommunities: ['testCommunity']
    }

    const post = {
      _id: 'testPostId',
      isDeleted: false,
      communityName: 'testCommunity',
      username: 'testUser',
      save: jest.fn()
    }

    const community = {
      name: 'testCommunity',
      settings: {
        allowSpoilers: true
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    UserModel.findOne = jest.fn().mockResolvedValue(user)
    PostModel.findOne = jest.fn().mockResolvedValue(post)
    CommunityModel.findOne = jest.fn().mockResolvedValue(community)

    await PostController.markSpoiler(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser', isDeleted: false })
    expect(PostModel.findOne).toHaveBeenCalledWith({ _id: 'testPostId', isDeleted: false })
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testCommunity' })
    expect(UserModel.findOne).toHaveBeenCalledTimes(1)
    expect(PostModel.findOne).toHaveBeenCalledTimes(1)
    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(post.save).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: 'Post marked as spoiler successfully' })
  })

  test('should return 404 error when post is not found', async () => {
    const req = {
      decoded: {
        username: 'testUser'
      },
      params: {
        postId: 'testPostId'
      },
      body: {
        isSpoiler: true
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const user = {
      username: 'testUser'
    }

    UserModel.findOne = jest.fn().mockResolvedValue(user)
    PostModel.findOne = jest.fn().mockResolvedValue(null)

    await PostController.markSpoiler(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser', isDeleted: false })
    expect(PostModel.findOne).toHaveBeenCalledWith({ _id: 'testPostId', isDeleted: false })
    expect(CommunityModel.findOne).not.toHaveBeenCalled()
    expect(UserModel.findOne).toHaveBeenCalledTimes(1)
    expect(PostModel.findOne).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ message: 'Post not found' })
  })

  test('should return 401 error when user is not authorized to mark the post as spoiler', async () => {
    const req = {
      decoded: {
        username: 'testUser'
      },
      params: {
        postId: 'testPostId'
      },
      body: {
        isSpoiler: true
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const user = {
      username: 'testUser',
      isDeleted: false,
      moderatorInCommunities: []
    }

    const post = {
      _id: 'testPostId',
      isDeleted: false,
      communityName: 'testCommunity',
      username: 'otherUser'
    }

    UserModel.findOne = jest.fn().mockResolvedValue(user)
    PostModel.findOne = jest.fn().mockResolvedValue(post)

    await PostController.markSpoiler(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser', isDeleted: false })
    expect(PostModel.findOne).toHaveBeenCalledWith({ _id: 'testPostId', isDeleted: false })
    expect(CommunityModel.findOne).not.toHaveBeenCalled()
    expect(UserModel.findOne).toHaveBeenCalledTimes(1)
    expect(PostModel.findOne).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ message: 'You are not authorized to mark this post as spoiler' })
  })

  test('should return 400 error when community does not allow spoilers and user tries to mark the post as spoiler', async () => {
    const req = {
      decoded: {
        username: 'testUser'
      },
      params: {
        postId: 'testPostId'
      },
      body: {
        isSpoiler: true
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const user = {
      username: 'testUser',
      isDeleted: false,
      moderatorInCommunities: []
    }

    const post = {
      _id: 'testPostId',
      isDeleted: false,
      communityName: 'testCommunity',
      username: 'testUser'
    }

    const community = {
      name: 'testCommunity',
      settings: {
        allowSpoilers: false
      }
    }

    UserModel.findOne = jest.fn().mockResolvedValue(user)
    PostModel.findOne = jest.fn().mockResolvedValue(post)
    CommunityModel.findOne = jest.fn().mockResolvedValue(community)

    await PostController.markSpoiler(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser', isDeleted: false })
    expect(PostModel.findOne).toHaveBeenCalledWith({ _id: 'testPostId', isDeleted: false })
    expect(CommunityModel.findOne).toHaveBeenCalledWith({ name: 'testCommunity' })
    expect(UserModel.findOne).toHaveBeenCalledTimes(1)
    expect(PostModel.findOne).toHaveBeenCalledTimes(1)
    expect(CommunityModel.findOne).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Community does not allow spoilers' })
  })

  test('should return a 500 error when user is not found', async () => {
    const req = {
      decoded: {
        username: 'testUser'
      },
      params: {
        postId: 'testPostId'
      },
      body: {
        isSpoiler: true
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    UserModel.findOne = jest.fn().mockResolvedValue(null)

    await PostController.markSpoiler(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ message: 'Cannot read properties of null (reading \'moderatorInCommunities\')' })
  })
})

describe('markNSFW', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should allow marking post as nsfw for moderator or post owner', async () => {
    const req = {
      decoded: {
        username: 'testUser'
      },
      params: {
        postId: 'testPostId'
      },
      body: {
        isNSFW: true
      }
    }

    const user = {
      username: 'testUser',
      isDeleted: false,
      moderatorInCommunities: ['testCommunity']
    }

    const post = {
      _id: 'testPostId',
      isDeleted: false,
      communityName: 'testCommunity',
      username: 'testUser',
      save: jest.fn()
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    UserModel.findOne = jest.fn().mockResolvedValue(user)
    PostModel.findOne = jest.fn().mockResolvedValue(post)

    await PostController.markNSFW(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser', isDeleted: false })
    expect(PostModel.findOne).toHaveBeenCalledWith({ _id: 'testPostId', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledTimes(1)
    expect(PostModel.findOne).toHaveBeenCalledTimes(1)
    expect(post.save).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: 'Post marked as nsfw successfully' })
  })

  test('should return 404 error when post is not found', async () => {
    const req = {
      decoded: {
        username: 'testUser'
      },
      params: {
        postId: 'testPostId'
      },
      body: {
        isNSFW: true
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const user = {
      username: 'testUser'
    }

    UserModel.findOne = jest.fn().mockResolvedValue(user)
    PostModel.findOne = jest.fn().mockResolvedValue(null)

    await PostController.markNSFW(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser', isDeleted: false })
    expect(PostModel.findOne).toHaveBeenCalledWith({ _id: 'testPostId', isDeleted: false })
    expect(CommunityModel.findOne).not.toHaveBeenCalled()
    expect(UserModel.findOne).toHaveBeenCalledTimes(1)
    expect(PostModel.findOne).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ message: 'Post not found' })
  })

  test('should return 401 error when user is not authorized to mark the post as nsfw', async () => {
    const req = {
      decoded: {
        username: 'testUser'
      },
      params: {
        postId: 'testPostId'
      },
      body: {
        isNSFW: true
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const user = {
      username: 'testUser',
      isDeleted: false,
      moderatorInCommunities: []
    }

    const post = {
      _id: 'testPostId',
      isDeleted: false,
      communityName: 'testCommunity',
      username: 'otherUser'
    }

    UserModel.findOne = jest.fn().mockResolvedValue(user)
    PostModel.findOne = jest.fn().mockResolvedValue(post)

    await PostController.markNSFW(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser', isDeleted: false })
    expect(PostModel.findOne).toHaveBeenCalledWith({ _id: 'testPostId', isDeleted: false })
    expect(CommunityModel.findOne).not.toHaveBeenCalled()
    expect(UserModel.findOne).toHaveBeenCalledTimes(1)
    expect(PostModel.findOne).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ message: 'You are not authorized to mark this post as NSFW' })
  })

  test('should return a 500 error when user is not found', async () => {
    const req = {
      decoded: {
        username: 'testUser'
      },
      params: {
        postId: 'testPostId'
      },
      body: {
        isSpoiler: true
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    UserModel.findOne = jest.fn().mockResolvedValue(null)

    await PostController.markNSFW(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ message: 'Cannot read properties of null (reading \'moderatorInCommunities\')' })
  })
})

describe('savePost', () => {
  test('should save a post successfully for a valid post ID and existing user', async () => {
    const req = {
      params: {
        postId: '65fcc9307932c5551dfd88e0'
      },
      decoded: {
        username: 'existingUser'
      },
      body: {
        isSaved: true
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    const post = {
      _id: '65fcc9307932c5551dfd88e0'
    }
    const user = {
      savedPosts: [],
      save: jest.fn()
    }
    PostModel.findOne = jest.fn().mockResolvedValue(post)
    UserModel.findOne = jest.fn().mockResolvedValue(user)

    await PostController.savePost(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: 'Post/comment saved successfully' })
    expect(user.savedPosts).toHaveLength(1)
    expect(user.savedPosts[0]).toEqual(expect.objectContaining({ postId: '65fcc9307932c5551dfd88e0' }))
    expect(user.save).toHaveBeenCalled()
  })

  test('should unsave a post successfully for a valid post ID and existing user', async () => {
    const req = {
      params: {
        postId: '65fcc9307932c5551dfd88e0'
      },
      decoded: {
        username: 'existingUser'
      },
      body: {
        isSaved: false
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    const post = {
      _id: '65fcc9307932c5551dfd88e0'
    }
    const user = {
      savedPosts: [{
        postId: '65fcc9307932c5551dfd88e0'
      }],
      save: jest.fn()
    }
    PostModel.findOne = jest.fn().mockResolvedValue(post)
    UserModel.findOne = jest.fn().mockResolvedValue(user)

    await PostController.savePost(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: 'Post/comment unsaved successfully' })
    expect(user.savedPosts).not.toContain('65fcc9307932c5551dfd88e0')
    expect(user.save).toHaveBeenCalled()
  })

  test('should return an error message when action is not specified', async () => {
    const req = {
      params: {
        postId: '65fcc9307932c5551dfd88e0'
      },
      decoded: {
        username: 'existingUser'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    const post = {
      _id: '65fcc9307932c5551dfd88e0'
    }
    const user = {
      savedPosts: [],
      save: jest.fn()
    }
    PostModel.findOne = jest.fn().mockResolvedValue(post)
    UserModel.findOne = jest.fn().mockResolvedValue(user)

    await PostController.savePost(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'isSaved field is required' })
    expect(user.savedPosts).not.toContain('65fcc9307932c5551dfd88e0')
    expect(user.save).not.toHaveBeenCalled()
  })

  test('should return an error message for a user with an invalid username', async () => {
    const req = {
      params: {
        postId: '65fcc9307932c5551dfd88e0'
      },
      decoded: {
        username: 'invalidUser'
      },
      body: {
        isSaved: false
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    const user = null
    UserModel.findOne = jest.fn().mockResolvedValue(user)

    await PostController.savePost(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'User is not found' })
  })

  test('should return an error message for an already saved post', async () => {
    const req = {
      params: {
        postId: '65fcc9307932c5551dfd88e0'
      },
      decoded: {
        username: 'invalidUser'
      },
      body: {
        isSaved: true
      }
    }
    const post = {
      _id: '65fcc9307932c5551dfd88e0'
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    const user = {
      savedPosts: [{
        postId: '65fcc9307932c5551dfd88e0'
      }],
      save: jest.fn()
    }
    PostModel.findOne = jest.fn().mockResolvedValue(post)
    UserModel.findOne = jest.fn().mockResolvedValue(user)

    await PostController.savePost(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Post/comment is already saved' })
  })

  test('should return an error message for an already unsaved post', async () => {
    const req = {
      params: {
        postId: '65fcc9307932c5551dfd88e0'
      },
      decoded: {
        username: 'invalidUser'
      },
      body: {
        isSaved: false
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    const post = {
      _id: '65fcc9307932c5551dfd88e0'
    }
    const user = {
      savedPosts: [],
      save: jest.fn()
    }
    PostModel.findOne = jest.fn().mockResolvedValue(post)
    UserModel.findOne = jest.fn().mockResolvedValue(user)

    await PostController.savePost(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Post/comment is not saved' })
  })

  test('should return 400 when post is is invalid', async () => {
    const req = {
      params: {
        postId: 'invalidPostId'
      },
      decoded: {
        username: 'invalidUser'
      },
      body: {
        isSaved: false
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    UserModel.findOne = jest.fn()

    await PostController.savePost(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid post id' })
    expect(UserModel.findOne).not.toHaveBeenCalled()
  })

  test('should return 400 when post is not found', async () => {
    const req = {
      params: {
        postId: '65fcc9307932c5551dfd88e0'
      },
      decoded: {
        username: 'invalidUser'
      },
      body: {
        isSaved: false
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    PostModel.findOne = jest.fn().mockResolvedValue(null)

    await PostController.savePost(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Post/comment is not found' })
  })

  test('should throw server error when saving post', async () => {
    const req = {
      params: {
        postId: '65fcc9307932c5551dfd88e0'
      },
      decoded: {
        username: 'invalidUser'
      },
      body: {
        isSaved: false
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    PostModel.findOne = jest.fn().mockRejectedValue(new Error('Server error'))

    await PostController.savePost(req, res)

    expect(res.json).toHaveBeenCalledWith({ message: 'Server error' })
    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('hidePost', () => {
  test('should hide a post successfully for a valid post ID and existing user', async () => {
    const req = {
      params: {
        postId: '65fcc9307932c5551dfd88e0'
      },
      decoded: {
        username: 'existingUser'
      },
      body: {
        isHidden: true
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    const post = {
      _id: '65fcc9307932c5551dfd88e0'
    }
    const user = {
      hiddenPosts: [],
      save: jest.fn()
    }
    PostModel.findOne = jest.fn().mockResolvedValue(post)
    UserModel.findOne = jest.fn().mockResolvedValue(user)

    await PostController.hidePost(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: 'Post visibility changed successfully' })
    expect(user.hiddenPosts).toHaveLength(1)
    expect(user.hiddenPosts[0]).toEqual(expect.objectContaining({ postId: '65fcc9307932c5551dfd88e0' }))
    expect(user.save).toHaveBeenCalled()
  })

  test('should unhide a post successfully for a valid post ID and existing user', async () => {
    const req = {
      params: {
        postId: '65fcc9307932c5551dfd88e0'
      },
      decoded: {
        username: 'existingUser'
      },
      body: {
        isHidden: false
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    const post = {
      _id: '65fcc9307932c5551dfd88e0'
    }
    const user = {
      hiddenPosts: [{
        postId: '65fcc9307932c5551dfd88e0'
      }],
      save: jest.fn()
    }
    PostModel.findOne = jest.fn().mockResolvedValue(post)
    UserModel.findOne = jest.fn().mockResolvedValue(user)

    await PostController.hidePost(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: 'Post visibility changed successfully' })
    expect(user.hiddenPosts).toHaveLength(0)
    expect(user.save).toHaveBeenCalled()
  })

  test('should return an error message when action is not specified', async () => {
    const req = {
      params: {
        postId: '65fcc9307932c5551dfd88e0'
      },
      decoded: {
        username: 'existingUser'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    const post = {
      _id: '65fcc9307932c5551dfd88e0'
    }
    const user = {
      hiddenPosts: [],
      save: jest.fn()
    }
    PostModel.findOne = jest.fn().mockResolvedValue(post)
    UserModel.findOne = jest.fn().mockResolvedValue(user)

    await PostController.hidePost(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'isHidden field is required' })
    expect(user.hiddenPosts).toHaveLength(0)
    expect(user.save).not.toHaveBeenCalled()
  })

  test('should return an error message for a user with an invalid username', async () => {
    const req = {
      params: {
        postId: '65fcc9307932c5551dfd88e0'
      },
      decoded: {
        username: 'invalidUser'
      },
      body: {
        isHidden: false
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    const user = null
    UserModel.findOne = jest.fn().mockResolvedValue(user)

    await PostController.hidePost(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'User is not found' })
  })

  test('should return an error message for an already hidden post', async () => {
    const req = {
      params: {
        postId: '65fcc9307932c5551dfd88e0'
      },
      decoded: {
        username: 'invalidUser'
      },
      body: {
        isHidden: true
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    const user = {
      hiddenPosts: [{
        postId: '65fcc9307932c5551dfd88e0'
      }],
      save: jest.fn()
    }
    UserModel.findOne = jest.fn().mockResolvedValue(user)

    await PostController.hidePost(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Post is already hidden' })
  })

  test('should return an error message for an already visible post', async () => {
    const req = {
      params: {
        postId: '65fcc9307932c5551dfd88e0'
      },
      decoded: {
        username: 'invalidUser'
      },
      body: {
        isHidden: false
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    const user = {
      hiddenPosts: [],
      save: jest.fn()
    }
    UserModel.findOne = jest.fn().mockResolvedValue(user)

    await PostController.hidePost(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Post is not hidden' })
  })

  test('should return 400 when post is is invalid', async () => {
    const req = {
      params: {
        postId: 'invalidPostId'
      },
      decoded: {
        username: 'invalidUser'
      },
      body: {
        isHidden: false
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    UserModel.findOne = jest.fn()

    await PostController.hidePost(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid post id' })
    expect(UserModel.findOne).not.toHaveBeenCalled()
  })

  test('should return 400 when post is not found', async () => {
    const req = {
      params: {
        postId: '65fcc9307932c5551dfd88e0'
      },
      decoded: {
        username: 'invalidUser'
      },
      body: {
        isHidden: false
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    PostModel.findOne = jest.fn().mockResolvedValue(null)

    await PostController.hidePost(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Post is not found' })
  })

  test('should throw server error when hiding post', async () => {
    const req = {
      params: {
        postId: '65fcc9307932c5551dfd88e0'
      },
      decoded: {
        username: 'invalidUser'
      },
      body: {
        isHidden: false
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    PostModel.findOne = jest.fn().mockRejectedValue(new Error('Server error'))

    await PostController.hidePost(req, res)

    expect(res.json).toHaveBeenCalledWith({ message: 'Server error' })
    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('lockPost', () => {
  test('should lock a post successfully for a valid post ID and authorized user', async () => {
    const req = {
      params: {
        postId: '65fcc9307932c5551dfd88e0'
      },
      decoded: {
        username: 'authorizedUser'
      },
      body: {
        isLocked: true
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    const post = {
      _id: '65fcc9307932c5551dfd88e0',
      communityName: 'Test Community',
      save: jest.fn()
    }
    const community = {
      communityName: 'Test Community',
      moderators: ['authorizedUser']
    }
    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    PostModel.findOne = jest.fn().mockResolvedValue(post)

    await PostController.lockPost(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: 'Post locked successfully' })
    expect(post.isLocked).toBe(true)
    expect(post.save).toHaveBeenCalled()
  })

  test('should lock a post successfully for a valid post ID and authorized user', async () => {
    const req = {
      params: {
        postId: '65fcc9307932c5551dfd88e0'
      },
      decoded: {
        username: 'authorizedUser'
      },
      body: {
        isLocked: false
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    const post = {
      _id: '65fcc9307932c5551dfd88e0',
      communityName: 'Test Community',
      save: jest.fn()
    }
    const community = {
      communityName: 'Test Community',
      moderators: ['authorizedUser']
    }
    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    PostModel.findOne = jest.fn().mockResolvedValue(post)

    await PostController.lockPost(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: 'Post unlocked successfully' })
    expect(post.isLocked).toBe(false)
    expect(post.save).toHaveBeenCalled()
  })

  test('should lock a post successfully for a personal post ID and authorized user', async () => {
    const req = {
      params: {
        postId: '65fcc9307932c5551dfd88e0'
      },
      decoded: {
        username: 'authorizedUser'
      },
      body: {
        isLocked: false
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    const post = {
      username: 'authorizedUser',
      _id: '65fcc9307932c5551dfd88e0',
      communityName: null,
      isLocked: true,
      save: jest.fn()
    }
    PostModel.findOne = jest.fn().mockResolvedValue(post)

    await PostController.lockPost(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: 'Post unlocked successfully' })
    expect(post.isLocked).toBe(false)
    expect(post.save).toHaveBeenCalled()
  })

  test('should return an error message when action is not specified', async () => {
    const req = {
      params: {
        postId: '65fcc9307932c5551dfd88e0'
      },
      decoded: {
        username: 'existingUser'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    const post = {
      _id: '65fcc9307932c5551dfd88e0',
      communityName: 'Test Community',
      save: jest.fn()
    }
    PostModel.findOne = jest.fn().mockResolvedValue(post)

    await PostController.lockPost(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'isLocked field is required' })
    expect(post.save).not.toHaveBeenCalled()
  })

  test('should return an error message for a user with an unauthorized username', async () => {
    const req = {
      params: {
        postId: '65fcc9307932c5551dfd88e0'
      },
      decoded: {
        username: 'unauthorizedUser'
      },
      body: {
        isLocked: false
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    const post = {
      _id: '65fcc9307932c5551dfd88e0',
      communityName: 'Test Community',
      save: jest.fn()
    }
    const community = {
      communityName: 'Test Community',
      moderators: ['authorizedUser']
    }
    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    PostModel.findOne = jest.fn().mockResolvedValue(post)

    await PostController.lockPost(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ message: 'You are not authorized to lock this post' })
    expect(post.save).not.toHaveBeenCalled()
  })

  test('should return an error message for an already locked post', async () => {
    const req = {
      params: {
        postId: '65fcc9307932c5551dfd88e0'
      },
      decoded: {
        username: 'authorizedUser'
      },
      body: {
        isLocked: true
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    const post = {
      username: 'author',
      _id: '65fcc9307932c5551dfd88e0',
      isLocked: true,
      communityName: 'Test Community',
      save: jest.fn()
    }
    const community = {
      communityName: 'Test Community',
      moderators: ['authorizedUser']
    }
    PostModel.findOne = jest.fn().mockResolvedValue(post)
    CommunityModel.findOne = jest.fn().mockResolvedValue(community)

    await PostController.lockPost(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Post is already locked' })
  })

  test('should return an error message for an already locked post', async () => {
    const req = {
      params: {
        postId: '65fcc9307932c5551dfd88e0'
      },
      decoded: {
        username: 'authorizedUser'
      },
      body: {
        isLocked: false
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    const post = {
      username: 'author',
      _id: '65fcc9307932c5551dfd88e0',
      isLocked: false,
      communityName: 'Test Community',
      save: jest.fn()
    }
    const community = {
      communityName: 'Test Community',
      moderators: ['authorizedUser']
    }
    PostModel.findOne = jest.fn().mockResolvedValue(post)
    CommunityModel.findOne = jest.fn().mockResolvedValue(community)

    await PostController.lockPost(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Post is already unlocked' })
  })

  test('should return 400 when post is is invalid', async () => {
    const req = {
      params: {
        postId: 'invalidPostId'
      },
      decoded: {
        username: 'invalidUser'
      },
      body: {
        isLocked: false
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    UserModel.findOne = jest.fn()

    await PostController.lockPost(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid post id' })
    expect(UserModel.findOne).not.toHaveBeenCalled()
  })

  test('should return 400 when post is not found', async () => {
    const req = {
      params: {
        postId: '65fcc9307932c5551dfd88e0'
      },
      decoded: {
        username: 'invalidUser'
      },
      body: {
        isLocked: false
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    PostModel.findOne = jest.fn().mockResolvedValue(null)

    await PostController.lockPost(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Post is not found' })
  })

  test('should throw server error when saving post', async () => {
    const req = {
      params: {
        postId: '65fcc9307932c5551dfd88e0'
      },
      decoded: {
        username: 'invalidUser'
      },
      body: {
        isLocked: false
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    PostModel.findOne = jest.fn().mockRejectedValue(new Error('Server error'))

    await PostController.lockPost(req, res)

    expect(res.json).toHaveBeenCalledWith({ message: 'Server error' })
    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('getPost', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should retrieve a post by ID for a guest', async () => {
    const req = {
      params: {
        postId: '55bb126babb335677998fbca'
      },
      query: {}
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const post = [{
      _id: '55bb126babb335677998fbca',
      isDeleted: false,
      communityName: 'community1',
      views: 1,
      commentCount: 0,
      profilePicture: 'icon.jpg',
      isNsfw: false
    }]

    PostModel.getPost = jest.fn().mockResolvedValue(post)
    PostModel.findOneAndUpdate = jest.fn().mockResolvedValue(post)

    await getPost(req, res)

    expect(PostModel.getPost).toHaveBeenCalled()
    expect(PostModel.findOneAndUpdate).toHaveBeenCalled()
    expect(UserModel.findOne).not.toHaveBeenCalled()
    expect(HistoryModel.findOne).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      _id: '55bb126babb335677998fbca',
      isDeleted: false,
      communityName: 'community1',
      views: 1,
      commentCount: 0,
      profilePicture: 'icon.jpg',
      isDownvoted: false,
      isHidden: false,
      isSaved: false,
      isUpvoted: false,
      isNSFW: false,
      isJoined: false,
      isModerator: false,
      isBlocked: false
    })
  })

  test('should retrieve a post by ID for a logged in user', async () => {
    const req = {
      params: {
        postId: '55bb126babb335677998fbca'
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

    const post = [{
      _id: '55bb126babb335677998fbca',
      isDeleted: false,
      communityName: 'community1',
      views: 1,
      commentCount: 0,
      profilePicture: 'icon.jpg',
      isNsfw: false,
      creatorBlockedUsers: [],
      username: 'user2'
    }]

    const user = {
      username: 'user1',
      isDeleted: false,
      upvotedPosts: [{ postId: '55bb126babb335677998fbca' }],
      downvotedPosts: [],
      savedPosts: [{ postId: '55bb126babb335677998fbca' }],
      hiddenPosts: [],
      communities: [],
      moderatorInCommunities: [],
      isNsfw: false,
      type: 'Post',
      blockedUsers: []
    }

    PostModel.getPost = jest.fn().mockResolvedValue(post)
    PostModel.findOneAndUpdate = jest.fn().mockResolvedValue(post)
    UserModel.findOne.mockResolvedValue(user)
    HistoryModel.findOne = jest.fn().mockResolvedValue(null)
    HistoryModel.create = jest.fn()

    await getPost(req, res)

    expect(PostModel.getPost).toHaveBeenCalled()
    expect(PostModel.findOneAndUpdate).toHaveBeenCalled()
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'user1', isDeleted: false })
    expect(HistoryModel.findOne).toHaveBeenCalledWith({ post: '55bb126babb335677998fbca', owner: 'user1' })
    expect(HistoryModel.create).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      _id: '55bb126babb335677998fbca',
      isDeleted: false,
      communityName: 'community1',
      views: 1,
      commentCount: 0,
      profilePicture: 'icon.jpg',
      isDownvoted: false,
      isHidden: false,
      isSaved: true,
      isUpvoted: true,
      isNSFW: false,
      isJoined: false,
      isModerator: false,
      isBlocked: false,
      username: 'user2'
    })
  })

  test('should retrieve a downvoted and hidden post by ID for a logged in user', async () => {
    const req = {
      params: {
        postId: '55bb126babb335677998fbca'
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

    const post = [{
      _id: '55bb126babb335677998fbca',
      type: 'Poll',
      pollOptions: [{ option: 'option1', voters: [] }, { option: 'option2', voters: [] }],
      expirationDate: '2024-12-12T00:00:00.000Z',
      isDeleted: false,
      communityName: 'community1',
      views: 1,
      commentCount: 0,
      profilePicture: 'icon.jpg',
      isNsfw: false,
      creatorBlockedUsers: [],
      username: 'user2'
    }]

    const user = {
      username: 'user1',
      isDeleted: false,
      upvotedPosts: [],
      downvotedPosts: [{ postId: '55bb126babb335677998fbca' }],
      savedPosts: [],
      hiddenPosts: [{ postId: '55bb126babb335677998fbca' }],
      communities: [],
      moderatorInCommunities: [],
      isNsfw: false,
      type: 'Post',
      blockedUsers: []
    }

    PostModel.getPost = jest.fn().mockResolvedValue(post)
    PostModel.findOneAndUpdate = jest.fn().mockResolvedValue(post)
    UserModel.findOne.mockResolvedValue(user)
    HistoryModel.findOne = jest.fn().mockResolvedValue(null)
    HistoryModel.create = jest.fn()

    await getPost(req, res)

    expect(PostModel.getPost).toHaveBeenCalled()
    expect(PostModel.findOneAndUpdate).toHaveBeenCalled()
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'user1', isDeleted: false })
    expect(HistoryModel.findOne).toHaveBeenCalledWith({ post: '55bb126babb335677998fbca', owner: 'user1' })
    expect(HistoryModel.create).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      _id: '55bb126babb335677998fbca',
      type: 'Poll',
      pollOptions: [{ option: 'option1', votes: 0, isVoted: false }, { option: 'option2', votes: 0, isVoted: false }],
      expirationDate: '2024-12-12T00:00:00.000Z',
      isDeleted: false,
      communityName: 'community1',
      views: 1,
      commentCount: 0,
      profilePicture: 'icon.jpg',
      isDownvoted: true,
      isHidden: true,
      isSaved: false,
      isUpvoted: false,
      isNSFW: false,
      isJoined: false,
      isModerator: false,
      isBlocked: false,
      username: 'user2'
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

    PostModel.getPost = jest.fn()
    PostModel.findOneAndUpdate = jest.fn()

    await getPost(req, res)

    expect(PostModel.getPost).not.toHaveBeenCalled()
    expect(UserModel.findOne).not.toHaveBeenCalled()
    expect(PostModel.findOneAndUpdate).not.toHaveBeenCalled()
    expect(HistoryModel.findOne).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Post ID is wrong'
    })
  })

  test('should return 404 if post does not exist', async () => {
    const req = {
      params: {
        postId: '55bb126babb335677998fbca'
      },
      query: {}
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const post = []

    PostModel.getPost = jest.fn().mockResolvedValue(post)
    PostModel.findOneAndUpdate = jest.fn()

    await getPost(req, res)

    expect(PostModel.getPost).toHaveBeenCalled()
    expect(PostModel.findOneAndUpdate).not.toHaveBeenCalled()
    expect(UserModel.findOne).not.toHaveBeenCalled()
    expect(HistoryModel.findOne).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Post does not exist'
    })
  })

  test('should return 404 if user does not exist', async () => {
    const req = {
      params: {
        postId: '55bb126babb335677998fbca'
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

    const user = null

    UserModel.findOne.mockResolvedValue(user)

    await getPost(req, res)

    expect(PostModel.getPost).not.toHaveBeenCalled()
    expect(PostModel.findOneAndUpdate).not.toHaveBeenCalled()
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'user1', isDeleted: false })
    expect(HistoryModel.findOne).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      message: 'User does not exist'
    })
  })

  test('should return 404 when use is blocked by post owner', async () => {
    const req = {
      params: {
        postId: '55bb126babb335677998fbca'
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

    const post = [{
      _id: '55bb126babb335677998fbca',
      isDeleted: false,
      communityName: 'community1',
      views: 1,
      commentCount: 0,
      profilePicture: 'icon.jpg',
      isNsfw: false,
      creatorBlockedUsers: ['user1'],
      username: 'user2'
    }]

    const user = {
      username: 'user1',
      isDeleted: false,
      upvotedPosts: [],
      downvotedPosts: [],
      savedPosts: [],
      hiddenPosts: [],
      communities: [],
      moderatorInCommunities: [],
      isNsfw: false,
      type: 'Post',
      blockedUsers: []
    }

    PostModel.getPost = jest.fn().mockResolvedValue(post)
    UserModel.findOne.mockResolvedValue(user)

    await getPost(req, res)

    expect(PostModel.getPost).toHaveBeenCalled()
    expect(PostModel.findOneAndUpdate).not.toHaveBeenCalled()
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'user1', isDeleted: false })
    expect(HistoryModel.findOne).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Post does not exist'
    })
  })

  test('should return 500 when server error occurs', async () => {
    const req = {
      params: {
        postId: '55bb126babb335677998fbca'
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

    const user = {
      username: 'user1',
      isDeleted: false,
      upvotedPosts: [],
      downvotedPosts: [],
      savedPosts: [],
      hiddenPosts: [],
      communities: [],
      moderatorInCommunities: [],
      isNsfw: false,
      type: 'Post',
      blockedUsers: []
    }

    PostModel.getPost = jest.fn().mockRejectedValue(new Error('Server error'))
    UserModel.findOne.mockResolvedValue(user)

    await getPost(req, res)

    expect(PostModel.getPost).toHaveBeenCalled()
    expect(PostModel.findOneAndUpdate).not.toHaveBeenCalled()
    expect(HistoryModel.findOne).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      message: 'An error occurred while getting post'
    })
  })
})

describe('getHomeFeed', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should return an error message when user does not exist', async () => {
    const req = {
      decoded: { username: 'nonexistentuser' },
      query: {
        page: 1,
        limit: 10,
        sort: 'best',
        time: 'all'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    UserModel.findOne = jest.fn().mockResolvedValue(null)

    await getHomeFeed(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      message: 'User does not exist'
    })
  })

  test('should return a list of posts sorted by best when user is not logged in', async () => {
    const req = {
      decoded: null,
      query: {
        page: 1,
        limit: 10,
        sort: 'best',
        time: 'all'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    PostModel.getRandomHomeFeed = jest.fn().mockResolvedValue([])

    await getHomeFeed(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalled()
  })

  test('should return a list of posts sorted by best when user is logged in and has no communities', async () => {
    const req = {
      decoded: {
        username: 'testUser'
      },
      query: {
        page: 1,
        limit: 10,
        sort: 'best',
        time: 'all'
      }
    }

    const user = {
      username: 'testUser',
      communities: [],
      mutedCommunities: [],
      preferences: {
        showAdultContent: false
      },
      follows: [],
      blockedUsers: [],
      moderatorInCommunities: []
    }

    UserModel.findOne = jest.fn().mockResolvedValue(user)
    PostModel.getRandomHomeFeed = jest.fn().mockResolvedValue([])

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    await getHomeFeed(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser', isDeleted: false })
    expect(PostModel.getRandomHomeFeed).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith([])
  })

  test('should return a list of posts sorted by rising when user is logged in and has no communities', async () => {
    const req = {
      decoded: {
        username: 'testUser'
      },
      query: {
        page: 1,
        limit: 10,
        sort: 'rising',
        time: 'all'
      }
    }

    const user = {
      username: 'testUser',
      mutedCommunities: [],
      preferences: {
        showAdultContent: false
      },
      follows: [],
      blockedUsers: [],
      moderatorInCommunities: ['community1'],
      upvotedPosts: [{ postId: '1' }],
      downvotedPosts: [{ postId: '2' }],
      savedPosts: [{ postId: '1' }],
      hiddenPosts: [{ postId: '2' }],
      communities: ['community1']
    }

    const posts = [
      {
        _id: '1',
        communityName: 'community1',
        isNsfw: false,
        pollOptions: [
          { option: 'option1', voters: [] },
          { option: 'option2', voters: [] }
        ],
        expirationDate: '2024-12-12T00:00:00.000Z',
        type: 'Poll'
      },
      {
        _id: '2',
        communityName: 'community2',
        isNsfw: true,
        pollOptions: [],
        expirationDate: null,
        type: 'Post'
      }
    ]

    UserModel.findOne = jest.fn().mockResolvedValue(user)
    PostModel.getSortedHomeFeed = jest.fn().mockResolvedValue(posts)

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    await getHomeFeed(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser', isDeleted: false })
    expect(PostModel.getSortedHomeFeed).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(
      [
        {
          _id: '1',
          communityName: 'community1',
          isNSFW: false,
          pollOptions: [
            { option: 'option1', votes: 0, isVoted: false },
            { option: 'option2', votes: 0, isVoted: false }
          ],
          expirationDate: '2024-12-12T00:00:00.000Z',
          type: 'Poll',
          isUpvoted: true,
          isDownvoted: false,
          isSaved: true,
          isHidden: false,
          isJoined: true,
          isModerator: true
        },
        {
          _id: '2',
          communityName: 'community2',
          isNSFW: true,
          type: 'Post',
          isUpvoted: false,
          isDownvoted: true,
          isSaved: false,
          isHidden: true,
          isJoined: false,
          isModerator: false
        }
      ]
    )
  })

  test('should return 500 when server error occurs', async () => {
    const req = {
      decoded: {
        username: 'testUser'
      },
      query: {
        page: 1,
        limit: 10,
        sort: 'best',
        time: 'all'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    UserModel.findOne = jest.fn().mockRejectedValue(new Error('Server error'))

    await getHomeFeed(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser', isDeleted: false })
    expect(PostModel.getRandomHomeFeed).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      message: 'An error occurred while getting home feed'
    })
  })
})

describe('getPopular', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should return a list of popular posts with expected properties', async () => {
    const req = {
      decoded: {
        username: 'testuser'
      },
      query: {
        page: '1',
        limit: '10'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const user = {
      username: 'testuser',
      blockedUsers: [],
      moderatorInCommunities: ['community1'],
      mutedCommunities: [],
      preferences: {
        showAdultContent: false
      },
      upvotedPosts: [{ postId: 'post1' }],
      downvotedPosts: [{ postId: 'post2' }],
      savedPosts: [{ postId: 'post1' }],
      hiddenPosts: [{ postId: 'post2' }],
      communities: ['community1']
    }

    const post = [{
      _id: 'post1',
      communityName: 'community1',
      isNsfw: false,
      pollOptions: [],
      expirationDate: null
    },
    {
      _id: 'post2',
      communityName: 'community2',
      isNsfw: true,
      pollOptions: [],
      expirationDate: null
    }
    ]

    UserModel.findOne = jest.fn().mockResolvedValue(user)
    PostModel.getPopular = jest.fn().mockResolvedValue(post)

    await PostController.getPopular(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testuser', isDeleted: false })
    expect(PostModel.getPopular).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 0,
        limit: 10,
        username: 'testuser',
        blockedUsers: [],
        moderatedCommunities: ['community1'],
        random: false
      }),
      null,
      false
    )
    expect(UserModel.findOne).toHaveBeenCalledTimes(1)
    expect(PostModel.getPopular).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith([{
      _id: 'post1',
      communityName: 'community1',
      isNSFW: false,
      isUpvoted: true,
      isDownvoted: false,
      isSaved: true,
      isHidden: false,
      isJoined: true,
      isModerator: true
    },
    {
      _id: 'post2',
      communityName: 'community2',
      isNSFW: true,
      isUpvoted: false,
      isDownvoted: true,
      isSaved: false,
      isHidden: true,
      isJoined: false,
      isModerator: false
    }
    ])
  })

  test('should return an error when there is a server error', async () => {
    const req = {
      decoded: {
        username: 'testuser'
      },
      query: {
        page: '1',
        limit: '10'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    UserModel.findOne = jest.fn().mockRejectedValue(new Error('Server error'))

    await PostController.getPopular(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testuser', isDeleted: false })
    expect(PostModel.getPopular).not.toHaveBeenCalled()
    expect(UserModel.findOne).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      message: 'An error occurred while getting home feed'
    })
  })

  test('should return an error when user does not exist', async () => {
    const req = {
      decoded: {
        username: 'nonexistentuser'
      },
      query: {
        page: '1',
        limit: '10'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    UserModel.findOne = jest.fn().mockResolvedValue(null)

    await PostController.getPopular(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'nonexistentuser', isDeleted: false })
    expect(PostModel.getPopular).not.toHaveBeenCalled()
    expect(UserModel.findOne).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      message: 'User does not exist'
    })
  })
})

describe('getComments', () => {
  test('should return 200 status code and an array of comments when valid post ID is provided', async () => {
    const req = {
      params: {
        postId: '2972dbbf638edddc2eea00ab'
      },
      query: {}
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const post = {
      _id: '2972dbbf638edddc2eea00ab',
      communityName: 'validCommunityName',
      isNsfw: false
    }

    const community = {
      communityName: 'validCommunityName',
      settings: {
        suggestedSort: 'top'
      }
    }

    const comments = [
      { _id: 'comment1', content: 'comment1 content' },
      { _id: 'comment2', content: 'comment2 content' }
    ]

    PostModel.getPost = jest.fn().mockResolvedValue([post])
    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    PostModel.getComments = jest.fn().mockResolvedValue(comments)

    await getComments(req, res)

    expect(PostModel.getPost).toHaveBeenCalled()
    expect(CommunityModel.findOne).toHaveBeenCalled()
    expect(PostModel.getComments).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(comments)
  })

  test('should return 200 status code and an array of comments when valid post ID is provided and user is authenticated', async () => {
    const req = {
      params: {
        postId: '2972dbbf638edddc2eea00ab'
      },
      query: {
        sort: 'best'
      },
      decoded: {
        username: 'validUsername'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const post = {
      _id: '2972dbbf638edddc2eea00ab',
      communityName: 'validCommunityName',
      isNsfw: false
    }

    const community = {
      communityName: 'validCommunityName',
      settings: {
        suggestedSort: 'top'
      }
    }

    const comments = [
      { _id: 'comment1', content: 'comment1 content' },
      { _id: 'comment2', content: 'comment2 content' }
    ]

    const user = {
      username: 'validUsername',
      isDeleted: false,
      upvotedPosts: [{ postId: 'comment1' }],
      downvotedPosts: [{ postId: 'comment2' }],
      savedPosts: [{ postId: 'comment1' }],
      hiddenPosts: [{ postId: 'comment2' }],
      blockedUsers: [],
      moderatorInCommunities: []
    }

    PostModel.getPost = jest.fn().mockResolvedValue([post])
    CommunityModel.findOne = jest.fn().mockResolvedValue(community)
    PostModel.getComments = jest.fn().mockResolvedValue(comments)
    UserModel.findOne = jest.fn().mockResolvedValue(user)

    await getComments(req, res)

    expect(PostModel.getPost).toHaveBeenCalled()
    expect(CommunityModel.findOne).toHaveBeenCalled()
    expect(PostModel.getComments).toHaveBeenCalled()
    expect(UserModel.findOne).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(comments)
  })

  test('should return 400 status code and an error message when invalid post ID is provided', async () => {
    const req = {
      params: {
        postId: 'invalidPostId'
      },
      query: {}
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    PostModel.getPost = jest.fn().mockResolvedValue(null)

    await getComments(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Post ID is wrong'
    })
  })

  test('should return 404 status code and an error message when valid post ID is provided but post does not exist', async () => {
    const req = {
      params: {
        postId: '2972dbbf638edddc2eea00ab'
      },
      query: {}
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const post = null
    PostModel.getPost = jest.fn().mockResolvedValue([post])

    await getComments(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Post does not exist'
    })
  })

  test('should return 404 status code and an error message when valid post ID is provided but community does not exist', async () => {
    const req = {
      params: {
        postId: '2972dbbf638edddc2eea00ab'
      },
      query: {}
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const post = {
      _id: '2972dbbf638edddc2eea00ab',
      communityName: 'validCommunityName',
      isNsfw: false
    }

    PostModel.getPost = jest.fn().mockResolvedValue([post])
    CommunityModel.findOne = jest.fn().mockResolvedValue(null)

    await getComments(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Community does not exist'
    })
  })

  test('should return 404 status code and an error message when user is authenticated but does not exist', async () => {
    const req = {
      params: {
        postId: '2972dbbf638edddc2eea00ab'
      },
      query: {},
      decoded: {
        username: 'validUsername'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const post = {
      _id: '2972dbbf638edddc2eea00ab',
      communityName: 'validCommunityName',
      isNsfw: false
    }

    UserModel.findOne = jest.fn().mockResolvedValue(null)
    PostModel.getPost = jest.fn().mockResolvedValue([post])

    await getComments(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      message: 'User does not exist'
    })
  })

  test('should return 500 status code and an error message when there is a server error', async () => {
    const req = {
      params: {
        postId: '2972dbbf638edddc2eea00ab'
      },
      query: {}
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    PostModel.getPost = jest.fn().mockRejectedValue(new Error('Server error'))

    await getComments(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      message: 'An error occurred while getting comments of post'
    })
  })
})

describe('votePost', () => {
  test('should upvote a post when req.type is upvote', async () => {
    const postId = '660460b9e212f19e0a5c274b'
    const username = 'username'

    const req = {
      params: { postId },
      decoded: { username },
      body: {},
      type: 'upvote'
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const postToVote = { _id: postId, upvote: 0, downvote: 0, netVote: 0, save: jest.fn() }
    const user = { username, preferences: { postsUpvotesNotifs: false }, upvotedPosts: [], downvotedPosts: [], save: jest.fn() }

    PostModel.findOne = jest.fn().mockResolvedValue(postToVote)
    UserModel.findOne = jest.fn().mockResolvedValue(user)
    jest.spyOn(PostUtils, 'upvotePost')

    await PostController.votePost(req, res)

    expect(PostModel.findOne).toHaveBeenCalledWith({ _id: postId, isDeleted: false, isRemoved: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username, isDeleted: false })
    expect(PostUtils.upvotePost).toHaveBeenCalledWith(postToVote, user)
    expect(postToVote.upvote).toBe(1)
    expect(postToVote.downvote).toBe(0)
    expect(postToVote.netVote).toBe(1)
    expect(user.upvotedPosts.length).toBe(1)
    expect(user.downvotedPosts.length).toBe(0)
    expect(postToVote.save).toHaveBeenCalled()
    expect(user.save).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Post voted successfully' }))
  })

  test('should downvote a post when req.type is downvote', async () => {
    const postId = '660460b9e212f19e0a5c274b'
    const username = 'username'

    const req = {
      params: { postId },
      decoded: { username },
      type: 'downvote'
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const postToVote = { _id: postId, upvote: 0, downvote: 0, netVote: 0, save: jest.fn() }
    const user = { username, upvotedPosts: [], downvotedPosts: [], save: jest.fn() }

    PostModel.findOne = jest.fn().mockResolvedValue(postToVote)
    UserModel.findOne = jest.fn().mockResolvedValue(user)
    jest.spyOn(PostUtils, 'downvotePost')

    await PostController.votePost(req, res)

    expect(PostModel.findOne).toHaveBeenCalledWith({ _id: postId, isDeleted: false, isRemoved: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username, isDeleted: false })
    expect(PostUtils.downvotePost).toHaveBeenCalledWith(postToVote, user)
    expect(postToVote.upvote).toBe(0)
    expect(postToVote.downvote).toBe(1)
    expect(postToVote.netVote).toBe(-1)
    expect(user.upvotedPosts.length).toBe(0)
    expect(user.downvotedPosts.length).toBe(1)
    expect(postToVote.save).toHaveBeenCalled()
    expect(user.save).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Post voted successfully' }))
  })

  test('should vote a pollOption for a poll when req.type is votePoll', async () => {
    const postId = '660460b9e212f19e0a5c274b'
    const username = 'username'

    const req = {
      params: { postId },
      decoded: { username },
      body: { pollOption: 'option2' },
      type: 'votePoll'
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const postToVote = { _id: postId, type: 'Poll', pollOptions: [{ text: 'option1', voters: [] }, { text: 'option2', voters: [] }], save: jest.fn() }
    const user = { username, save: jest.fn() }

    PostModel.findOne = jest.fn().mockResolvedValue(postToVote)
    UserModel.findOne = jest.fn().mockResolvedValue(user)
    jest.spyOn(PostUtils, 'votePoll')

    await PostController.votePost(req, res)

    expect(PostModel.findOne).toHaveBeenCalledWith({ _id: postId, isDeleted: false, isRemoved: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username, isDeleted: false })
    expect(PostUtils.votePoll).toHaveBeenCalledWith(postToVote, user, 'option2')
    expect(postToVote.pollOptions).toStrictEqual([
      { text: 'option1', voters: [] },
      { text: 'option2', voters: [username] }
    ])
    expect(postToVote.save).toHaveBeenCalled()
    expect(user.save).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Post voted successfully' }))
  })

  test('should reverse upvote before downvoting a post when req.type is downvote', async () => {
    const postId = '660460b9e212f19e0a5c274b'
    const username = 'username'

    const req = {
      params: { postId },
      decoded: { username },
      type: 'downvote'
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const postToVote = { _id: postId, upvote: 1, downvote: 0, netVote: 1, save: jest.fn() }
    const user = { username, upvotedPosts: [{ postId: new ObjectId('660460b9e212f19e0a5c274b'), savedAt: new Date() }], downvotedPosts: [], save: jest.fn() }

    PostModel.findOne = jest.fn().mockResolvedValue(postToVote)
    UserModel.findOne = jest.fn().mockResolvedValue(user)
    jest.spyOn(PostUtils, 'downvotePost')

    await PostController.votePost(req, res)

    expect(PostModel.findOne).toHaveBeenCalledWith({ _id: postId, isDeleted: false, isRemoved: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username, isDeleted: false })
    expect(PostUtils.downvotePost).toHaveBeenCalledWith(postToVote, user)
    expect(postToVote.upvote).toBe(0)
    expect(postToVote.downvote).toBe(1)
    expect(postToVote.netVote).toBe(-1)
    expect(user.upvotedPosts.length).toBe(0)
    expect(user.downvotedPosts.length).toBe(1)
    expect(postToVote.save).toHaveBeenCalled()
    expect(user.save).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Post voted successfully' }))
  })

  test('should reverse upvote when already upvoted', async () => {
    const postId = '660460b9e212f19e0a5c274b'
    const username = 'username'

    const req = {
      params: { postId },
      decoded: { username },
      type: 'upvote'
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const postToVote = { _id: postId, upvote: 1, downvote: 0, netVote: 1, save: jest.fn() }
    const user = { username, preferences: { postsUpvotesNotifs: false }, upvotedPosts: [{ postId: new ObjectId('660460b9e212f19e0a5c274b'), savedAt: new Date() }], downvotedPosts: [], save: jest.fn() }

    PostModel.findOne = jest.fn().mockResolvedValue(postToVote)
    UserModel.findOne = jest.fn().mockResolvedValue(user)
    jest.spyOn(PostUtils, 'downvotePost')

    await PostController.votePost(req, res)

    expect(PostModel.findOne).toHaveBeenCalledWith({ _id: postId, isDeleted: false, isRemoved: false })
    expect(UserModel.findOne).toHaveBeenCalledWith({ username, isDeleted: false })
    expect(PostUtils.upvotePost).toHaveBeenCalledWith(postToVote, user)
    expect(postToVote.upvote).toBe(0)
    expect(postToVote.downvote).toBe(0)
    expect(postToVote.netVote).toBe(0)
    expect(user.upvotedPosts.length).toBe(0)
    expect(user.downvotedPosts.length).toBe(0)
    expect(postToVote.save).toHaveBeenCalled()
    expect(user.save).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Post voted successfully' }))
  })

  test('should return an error message when post is not found', async () => {
    const postId = '660460b9e212f19e0a5c274b'
    const username = 'username'

    const req = {
      params: { postId },
      decoded: { username },
      type: 'upvote'
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    PostModel.findOne = jest.fn().mockResolvedValue(null)

    await PostController.votePost(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Post does not exist' }))
  })

  test('should return an error message when pollOption does not exist', async () => {
    const postId = '660460b9e212f19e0a5c274b'
    const username = 'username'

    const req = {
      params: { postId },
      decoded: { username },
      body: { pollOption: 'option3' },
      type: 'votePoll'
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const postToVote = { _id: postId, type: 'Poll', pollOptions: [{ text: 'option1', voters: [] }, { text: 'option2', voters: [] }], save: jest.fn() }
    const user = { username, preferences: { postsUpvotesNotifs: false }, save: jest.fn() }

    PostModel.findOne = jest.fn().mockResolvedValue(postToVote)
    UserModel.findOne = jest.fn().mockResolvedValue(user)
    jest.spyOn(PostUtils, 'votePoll')

    await PostController.votePost(req, res)

    expect(PostUtils.votePoll).toHaveBeenCalled()
    expect(postToVote.save).not.toHaveBeenCalled()
    expect(user.save).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Invalid poll option' }))
  })

  test('should return an error message when post id is not valid', async () => {
    const postId = 'invalidPostId'
    const username = 'username'

    const req = {
      params: { postId },
      decoded: { username },
      type: 'upvote'
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    await PostController.votePost(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Invalid post id' }))
  })
})

describe('reportPost', () => {
  const Post = require('../src/models/Post')
  const Community = require('../src/models/Community')
  const Report = require('../src/models/Report')
  test('should successfully report a post with valid inputs', async () => {
    const req = {
      params: {
        postId: 'validPostId'
      },
      body: {
        communityRule: 'validCommunityRule'
      },
      decoded: {
        username: 'validUsername'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const post = {
      _id: 'validPostId',
      isDeleted: false,
      isRemoved: false,
      communityName: 'validCommunityName',
      type: 'Post',
      username: 'otherUser'
    }

    const community = {
      name: 'validCommunityName',
      isDeleted: false,
      rules: [
        {
          text: 'validCommunityRule',
          appliesTo: 'validAppliesTo'
        }
      ]
    }

    Post.findOne = jest.fn().mockResolvedValue(post)
    Community.findOne = jest.fn().mockResolvedValue(community)
    Report.findOne = jest.fn().mockResolvedValue(null)
    Report.prototype.save = jest.fn()

    await reportPost(req, res)

    expect(Post.findOne).toHaveBeenCalledWith({ _id: 'validPostId', isDeleted: false, isRemoved: false })
    expect(Community.findOne).toHaveBeenCalledWith({ name: 'validCommunityName', isDeleted: false })
    expect(Report.findOne).toHaveBeenCalledWith({ user: 'validUsername', post: 'validPostId', reason: 'validCommunityRule', isDeleted: false })
    expect(Report.prototype.save).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: 'Report Submitted\nThanks for your report and for looking out for yourself and your fellow redditors. Your reporting helps make Reddit a better, safer, and more welcoming place for everyone; and it means a lot to us. ' })
  })
  test('should return a 404 error when reporting a non-existent post', async () => {
    const req = {
      params: {
        postId: 'nonExistentPostId'
      },
      body: {
        communityRule: 'validCommunityRule'
      },
      decoded: {
        username: 'validUsername'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    Post.findOne = jest.fn().mockResolvedValue(null)

    await reportPost(req, res)

    expect(Post.findOne).toHaveBeenCalledWith({ _id: 'nonExistentPostId', isDeleted: false, isRemoved: false })
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ message: 'Post not found' })
  })
  test('should report a post with a community rule that applies to both posts and comments', async () => {
    const req = {
      params: {
        postId: 'validPostId'
      },
      body: {
        communityRule: 'validCommunityRule'
      },
      decoded: {
        username: 'validUsername'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const post = {
      _id: 'validPostId',
      isDeleted: false,
      isRemoved: false,
      communityName: 'validCommunityName',
      type: 'Post',
      username: 'otherUser'
    }

    const community = {
      name: 'validCommunityName',
      isDeleted: false,
      rules: [
        {
          text: 'validCommunityRule',
          appliesTo: 'Posts & comments'
        }
      ]
    }

    Post.findOne = jest.fn().mockResolvedValue(post)
    Community.findOne = jest.fn().mockResolvedValue(community)
    Report.findOne = jest.fn().mockResolvedValue(null)
    Report.prototype.save = jest.fn()

    await reportPost(req, res)

    expect(Post.findOne).toHaveBeenCalledWith({ _id: 'validPostId', isDeleted: false, isRemoved: false })
    expect(Community.findOne).toHaveBeenCalledWith({ name: 'validCommunityName', isDeleted: false })
    expect(Report.findOne).toHaveBeenCalledWith({ user: 'validUsername', post: 'validPostId', reason: 'validCommunityRule', isDeleted: false })
    expect(Report.prototype.save).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: 'Report Submitted\nThanks for your report and for looking out for yourself and your fellow redditors. Your reporting helps make Reddit a better, safer, and more welcoming place for everyone; and it means a lot to us. ' })
  })
  test('should report a post with a community rule that applies to posts only', async () => {
    const req = {
      params: {
        postId: 'validPostId'
      },
      body: {
        communityRule: 'validCommunityRule'
      },
      decoded: {
        username: 'validUsername'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const post = {
      _id: 'validPostId',
      isDeleted: false,
      isRemoved: false,
      communityName: 'validCommunityName',
      type: 'Post',
      username: 'otherUser'
    }

    const community = {
      name: 'validCommunityName',
      isDeleted: false,
      rules: [
        {
          text: 'validCommunityRule',
          appliesTo: 'Posts only'
        }
      ]
    }

    Post.findOne = jest.fn().mockResolvedValue(post)
    Community.findOne = jest.fn().mockResolvedValue(community)
    Report.findOne = jest.fn().mockResolvedValue(null)
    Report.prototype.save = jest.fn()

    await reportPost(req, res)

    expect(Post.findOne).toHaveBeenCalledWith({ _id: 'validPostId', isDeleted: false, isRemoved: false })
    expect(Community.findOne).toHaveBeenCalledWith({ name: 'validCommunityName', isDeleted: false })
    expect(Report.findOne).toHaveBeenCalledWith({ user: 'validUsername', post: 'validPostId', reason: 'validCommunityRule', isDeleted: false })
    expect(Report.prototype.save).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: 'Report Submitted\nThanks for your report and for looking out for yourself and your fellow redditors. Your reporting helps make Reddit a better, safer, and more welcoming place for everyone; and it means a lot to us. ' })
  })
  test('should report a comment with a community rule that applies comments only', async () => {
    const req = {
      params: {
        postId: 'validPostId'
      },
      body: {
        communityRule: 'validCommunityRule'
      },
      decoded: {
        username: 'validUsername'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const post = {
      _id: 'validPostId',
      isDeleted: false,
      isRemoved: false,
      communityName: 'validCommunityName',
      type: 'Comment',
      username: 'otherUser'
    }

    const community = {
      name: 'validCommunityName',
      isDeleted: false,
      rules: [
        {
          text: 'validCommunityRule',
          appliesTo: 'Comments only'
        }
      ]
    }

    Post.findOne = jest.fn().mockResolvedValue(post)
    Community.findOne = jest.fn().mockResolvedValue(community)
    Report.findOne = jest.fn().mockResolvedValue(null)
    Report.prototype.save = jest.fn()

    await reportPost(req, res)

    expect(Post.findOne).toHaveBeenCalledWith({ _id: 'validPostId', isDeleted: false, isRemoved: false })
    expect(Community.findOne).toHaveBeenCalledWith({ name: 'validCommunityName', isDeleted: false })
    expect(Report.findOne).toHaveBeenCalledWith({ user: 'validUsername', post: 'validPostId', reason: 'validCommunityRule', isDeleted: false })
    expect(Report.prototype.save).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: 'Report Submitted\nThanks for your report and for looking out for yourself and your fellow redditors. Your reporting helps make Reddit a better, safer, and more welcoming place for everyone; and it means a lot to us. ' })
  })

  test('should return a 404 error when reporting a non-existent community', async () => {
    const req = {
      params: {
        postId: 'validPostId'
      },
      body: {
        communityRule: 'validCommunityRule'
      },
      decoded: {
        username: 'validUsername'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const post = {
      _id: 'validPostId',
      isDeleted: false,
      isRemoved: false,
      communityName: 'validCommunityName',
      type: 'Post',
      username: 'otherUser'
    }

    Post.findOne = jest.fn().mockResolvedValue(post)
    Community.findOne = jest.fn().mockResolvedValue(null)

    await reportPost(req, res)

    expect(Post.findOne).toHaveBeenCalledWith({ _id: 'validPostId', isDeleted: false, isRemoved: false })
    expect(Community.findOne).toHaveBeenCalledWith({ name: 'validCommunityName', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ message: 'Community not found' })
  })

  test('should return a 400 error when post does not belong to a community', async () => {
    const req = {
      params: {
        postId: 'validPostId'
      },
      body: {
        communityRule: 'validCommunityRule'
      },
      decoded: {
        username: 'validUsername'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const post = {
      _id: 'validPostId',
      isDeleted: false,
      isRemoved: false,
      communityName: null,
      type: 'Post',
      username: 'otherUser'
    }

    Post.findOne = jest.fn().mockResolvedValue(post)

    await reportPost(req, res)

    expect(Post.findOne).toHaveBeenCalledWith({ _id: 'validPostId', isDeleted: false, isRemoved: false })
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Post does not belong to a community' })
  })

  test('should return a 400 error when community rule does not apply to post type', async () => {
    const req = {
      params: {
        postId: 'validPostId'
      },
      body: {
        communityRule: 'validCommunityRule'
      },
      decoded: {
        username: 'validUsername'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const post = {
      _id: 'validPostId',
      isDeleted: false,
      isRemoved: false,
      communityName: 'validCommunityName',
      type: 'Comment',
      username: 'otherUser'
    }

    const community = {
      name: 'validCommunityName',
      isDeleted: false,
      rules: [
        {
          text: 'validCommunityRule',
          appliesTo: 'Posts only'
        }
      ]
    }

    Post.findOne = jest.fn().mockResolvedValue(post)
    Community.findOne = jest.fn().mockResolvedValue(community)

    await reportPost(req, res)

    expect(Post.findOne).toHaveBeenCalledWith({ _id: 'validPostId', isDeleted: false, isRemoved: false })
    expect(Community.findOne).toHaveBeenCalledWith({ name: 'validCommunityName', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Community rule does not apply' })
  })

  test('should return a 400 error when reporting your own post', async () => {
    const req = {
      params: {
        postId: 'validPostId'
      },
      body: {
        communityRule: 'validCommunityRule'
      },
      decoded: {
        username: 'otherUser'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const post = {
      _id: 'validPostId',
      isDeleted: false,
      isRemoved: false,
      communityName: 'validCommunityName',
      type: 'Post',
      username: 'otherUser'
    }

    Post.findOne = jest.fn().mockResolvedValue(post)

    await reportPost(req, res)

    expect(Post.findOne).toHaveBeenCalledWith({ _id: 'validPostId', isDeleted: false, isRemoved: false })
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'You cannot report your own post' })
  })

  test('should return a 500 error when an error occurs while reporting a post', async () => {
    const req = {
      params: {
        postId: 'validPostId'
      },
      body: {
        communityRule: 'validCommunityRule'
      },
      decoded: {
        username: 'validUsername'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    Post.findOne = jest.fn().mockRejectedValue(new Error('Database error'))

    await reportPost(req, res)

    expect(Post.findOne).toHaveBeenCalledWith({ _id: 'validPostId', isDeleted: false, isRemoved: false })
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ message: 'Database error' })
  })
})

describe('acceptPost', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should successfully approve a post when all conditions are met', async () => {
    const req = {
      decoded: {
        username: 'testuser'
      },
      params: {
        postId: '1234567890'
      },
      body: {
        isApproved: true
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const user = {
      moderatorInCommunities: ['community1', 'community2']
    }

    const post = {
      communityName: 'community1',
      isDeleted: false,
      save: jest.fn()
    }

    UserModel.findOne = jest.fn().mockResolvedValue(user)
    PostModel.findOne = jest.fn().mockResolvedValue(post)

    await PostController.acceptPost(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testuser', isDeleted: false })
    expect(PostModel.findOne).toHaveBeenCalledWith({ _id: '1234567890', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledTimes(1)
    expect(PostModel.findOne).toHaveBeenCalledTimes(1)
    expect(post.isApproved).toBe(true)
    expect(post.save).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: 'Post approved successfully' })
  })

  test('should return a 404 error when post is not found', async () => {
    const req = {
      decoded: {
        username: 'testuser'
      },
      params: {
        postId: '1234567890'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const user = {
      moderatorInCommunities: ['community1', 'community2']
    }

    UserModel.findOne = jest.fn().mockResolvedValue(user)
    PostModel.findOne = jest.fn().mockResolvedValue(null)

    await PostController.acceptPost(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testuser', isDeleted: false })
    expect(PostModel.findOne).toHaveBeenCalledWith({ _id: '1234567890', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledTimes(1)
    expect(PostModel.findOne).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ message: 'Post not found' })
  })

  test('should return a 404 error if user is not found', async () => {
    const req = {
      decoded: {
        username: 'testuser'
      },
      params: {
        postId: '1234567890'
      },
      body: {
        isApproved: true
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const user = null

    const post = {
      communityName: 'community1',
      isDeleted: false
    }

    UserModel.findOne = jest.fn().mockResolvedValue(user)
    PostModel.findOne = jest.fn().mockResolvedValue(post)

    await PostController.acceptPost(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testuser', isDeleted: false })
    expect(PostModel.findOne).toHaveBeenCalledWith({ _id: '1234567890', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledTimes(1)
    expect(PostModel.findOne).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' })
  })

  test('should return a 401 error when user is not authorized to approve the post', async () => {
    const req = {
      decoded: {
        username: 'testuser'
      },
      params: {
        postId: '1234567890'
      },
      body: {
        isApproved: true
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const user = {
      moderatorInCommunities: ['community1', 'community2']
    }

    const post = {
      communityName: 'community3',
      isDeleted: false
    }

    UserModel.findOne = jest.fn().mockResolvedValue(user)
    PostModel.findOne = jest.fn().mockResolvedValue(post)

    await PostController.acceptPost(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testuser', isDeleted: false })
    expect(PostModel.findOne).toHaveBeenCalledWith({ _id: '1234567890', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledTimes(1)
    expect(PostModel.findOne).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ message: 'You are not authorized to approve this post' })
  })

  test('should return a 500 error if an error occurs while approving the post', async () => {
    const req = {
      decoded: {
        username: 'testuser'
      },
      params: {
        postId: '1234567890'
      },
      body: {
        isApproved: true
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    UserModel.findOne = jest.fn().mockRejectedValue(new Error('Database error'))

    await PostController.acceptPost(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testuser', isDeleted: false })
    expect(PostModel.findOne).not.toHaveBeenCalled()
    expect(UserModel.findOne).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ message: 'Error approving post: Database error' })
  })
})

describe('removePost', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should successfully remove a post when all conditions are met', async () => {
    const req = {
      decoded: {
        username: 'testuser'
      },
      params: {
        postId: '1234567890'
      },
      body: {
        isRemoved: true
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const user = {
      moderatorInCommunities: ['community1', 'community2']
    }

    const post = {
      communityName: 'community1',
      isDeleted: false,
      save: jest.fn()
    }

    UserModel.findOne = jest.fn().mockResolvedValue(user)
    PostModel.findOne = jest.fn().mockResolvedValue(post)

    await PostController.removePost(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testuser', isDeleted: false })
    expect(PostModel.findOne).toHaveBeenCalledWith({ _id: '1234567890', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledTimes(1)
    expect(PostModel.findOne).toHaveBeenCalledTimes(1)
    expect(post.isRemoved).toBe(true)
    expect(post.save).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: 'Post removed successfully' })
  })

  test('should return a 404 error when post is not found', async () => {
    const req = {
      decoded: {
        username: 'testuser'
      },
      params: {
        postId: '1234567890'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const user = {
      moderatorInCommunities: ['community1', 'community2']
    }

    UserModel.findOne = jest.fn().mockResolvedValue(user)
    PostModel.findOne = jest.fn().mockResolvedValue(null)

    await PostController.removePost(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testuser', isDeleted: false })
    expect(PostModel.findOne).toHaveBeenCalledWith({ _id: '1234567890', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledTimes(1)
    expect(PostModel.findOne).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ message: 'Post not found' })
  })

  test('should return a 404 error if user is not found', async () => {
    const req = {
      decoded: {
        username: 'testuser'
      },
      params: {
        postId: '1234567890'
      },
      body: {
        isRemoved: true
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const user = null

    const post = {
      communityName: 'community1',
      isDeleted: false
    }

    UserModel.findOne = jest.fn().mockResolvedValue(user)
    PostModel.findOne = jest.fn().mockResolvedValue(post)

    await PostController.removePost(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testuser', isDeleted: false })
    expect(PostModel.findOne).toHaveBeenCalledWith({ _id: '1234567890', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledTimes(1)
    expect(PostModel.findOne).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' })
  })

  test('should return a 401 error when user is not authorized to remove the post', async () => {
    const req = {
      decoded: {
        username: 'testuser'
      },
      params: {
        postId: '1234567890'
      },
      body: {
        isRemoved: true
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const user = {
      moderatorInCommunities: ['community1', 'community2']
    }

    const post = {
      communityName: 'community3',
      isDeleted: false
    }

    UserModel.findOne = jest.fn().mockResolvedValue(user)
    PostModel.findOne = jest.fn().mockResolvedValue(post)

    await PostController.removePost(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testuser', isDeleted: false })
    expect(PostModel.findOne).toHaveBeenCalledWith({ _id: '1234567890', isDeleted: false })
    expect(UserModel.findOne).toHaveBeenCalledTimes(1)
    expect(PostModel.findOne).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ message: 'You are not authorized to remove this post' })
  })

  test('should return a 500 error if an error occurs while approving the post', async () => {
    const req = {
      decoded: {
        username: 'testuser'
      },
      params: {
        postId: '1234567890'
      },
      body: {
        isRemoved: true
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    UserModel.findOne = jest.fn().mockRejectedValue(new Error('Database error'))

    await PostController.removePost(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testuser', isDeleted: false })
    expect(PostModel.findOne).not.toHaveBeenCalled()
    expect(UserModel.findOne).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ message: 'Error removing post: Database error' })
  })
})

describe('deleteImages', () => {
  jest.unmock('../src/utils/Media')
  test('should delete images when all conditions are met', async () => {
    MediaUtils.cloudinary.uploader.destroy = jest.fn().mockResolvedValue({ result: 'ok' })

    await MediaUtils.deleteImages(['image1', 'image2'])

    expect(MediaUtils.cloudinary.uploader.destroy).toHaveBeenCalledTimes(0)
  })

  test('should delete images when all conditions are met', async () => {
    MediaUtils.cloudinary.uploader.destroy = jest.fn().mockResolvedValue({ result: 'ok' })

    expect(MediaUtils.deleteImages(['res.cloudinary.com'])).rejects.toThrow(new Error('Invalid image or video URLs found in post'))

    expect(MediaUtils.cloudinary.uploader.destroy).toHaveBeenCalledTimes(0)
  })

  test('should delete images when all conditions are met', async () => {
    MediaUtils.cloudinary.uploader.destroy = jest.fn().mockResolvedValue({ result: 'ok' })

    await MediaUtils.deleteImages(['res.cloudinary.com/cReddit/a.mp4'])

    expect(MediaUtils.cloudinary.uploader.destroy).toHaveBeenCalledTimes(1)
  })
})
