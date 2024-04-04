const PostController = require('../src/controllers/Post')
const CommunityModel = require('../src/models/Community')
const PostModel = require('../src/models/Post')
const UserModel = require('../src/models/User')
const HistoryModel = require('../src/models/History')
const cloudinary = require('../src/utils/Cloudinary')
const { getPost, getHomeFeed } = require('../src/controllers/Post')

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

    CommunityModel.findOne = jest.fn().mockResolvedValue({ name: 'Test Community' })

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
      isNsfw: false
    })
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith({ message: 'Post created successfully' })
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

    cloudinary.uploader.upload = jest.fn().mockResolvedValue({ secure_url: 'secure_url' })

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    await PostController.createPost(req, res)

    expect(cloudinary.uploader.upload).toHaveBeenCalledTimes(5)
    expect(PostModel).toHaveBeenCalledWith({
      type: 'Images & Video',
      username: 'Test User',
      communityName: null,
      title: 'Test Title',
      content: 'secure_url secure_url secure_url secure_url secure_url',
      pollOptions: [],
      expirationDate: null,
      isSpoiler: false,
      isNsfw: false
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
      isNsfw: false
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

    CommunityModel.findOne = jest.fn().mockResolvedValue({ name: 'Test Community' })

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
      isNsfw: true
    })
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith({ message: 'Post created successfully' })
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

    CommunityModel.findOne = jest.fn().mockResolvedValue({ name: 'Test Community' })

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
      isNsfw: true
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
      deleteOne: jest.fn()
    }
    cloudinary.uploader.destroy = jest.fn()
    PostModel.findOne = jest.fn().mockResolvedValue(post)

    await PostController.deletePost(req, res)

    expect(res.json).toHaveBeenCalledWith({ message: 'Post deleted successfully' })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(PostModel.findOne).toHaveBeenCalledWith({ _id: '65fcc9307932c5551dfd88e0' })
    expect(post.deleteOne).toHaveBeenCalled()
    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('cReddit/image1')
    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('cReddit/video1', { resource_type: 'video' })
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
    cloudinary.uploader.destroy = jest.fn()
    PostModel.findOne = jest.fn().mockResolvedValue(post)

    await PostController.deletePost(req, res)

    expect(res.json).toHaveBeenCalledWith({ message: 'You are not authorized to delete this post' })
    expect(res.status).toHaveBeenCalledWith(403)
    expect(PostModel.findOne).toHaveBeenCalledWith({ _id: '65fcc9307932c5551dfd88e0' })
    expect(post.deleteOne).not.toHaveBeenCalled()
    expect(cloudinary.uploader.destroy).not.toHaveBeenCalledWith('cReddit/image1')
    expect(cloudinary.uploader.destroy).not.toHaveBeenCalledWith('cReddit/video1', { resource_type: 'video' })
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
    cloudinary.uploader.destroy = jest.fn()
    PostModel.findOne = jest.fn().mockResolvedValue(post)

    await PostController.deletePost(req, res)

    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid post id' })
    expect(res.status).toHaveBeenCalledWith(400)
    expect(PostModel.findOne).not.toHaveBeenCalledWith({ _id: 'InvalidPostId' })
    expect(post.deleteOne).not.toHaveBeenCalled()
    expect(cloudinary.uploader.destroy).not.toHaveBeenCalledWith('cReddit/image1')
    expect(cloudinary.uploader.destroy).not.toHaveBeenCalledWith('cReddit/video1', { resource_type: 'video' })
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
    cloudinary.uploader.destroy = jest.fn()
    PostModel.findOne = jest.fn().mockResolvedValue(null)

    await PostController.deletePost(req, res)

    expect(res.json).toHaveBeenCalledWith({ message: 'Post is not found' })
    expect(res.status).toHaveBeenCalledWith(400)
    expect(PostModel.findOne).toHaveBeenCalledWith({ _id: '65fcc9307932c5551dfd88e0' })
    expect(cloudinary.uploader.destroy).not.toHaveBeenCalledWith('cReddit/image1')
    expect(cloudinary.uploader.destroy).not.toHaveBeenCalledWith('cReddit/video1', { resource_type: 'video' })
  })

  test('should not delete a post when invalid image url', async () => {
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
      content: 'cRedditimage1.jpg cReddit/video1.mp4',
      deleteOne: jest.fn()
    }
    cloudinary.uploader.destroy = jest.fn()
    PostModel.findOne = jest.fn().mockResolvedValue(post)

    await PostController.deletePost(req, res)

    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid image or video URLs found in post' })
    expect(res.status).toHaveBeenCalledWith(500)
    expect(PostModel.findOne).toHaveBeenCalledWith({ _id: '65fcc9307932c5551dfd88e0' })
    expect(cloudinary.uploader.destroy).not.toHaveBeenCalledWith('cRedditimage1')
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
    expect(res.json).toHaveBeenCalledWith({ message: 'Post saved successfully' })
    expect(user.savedPosts).toContain('65fcc9307932c5551dfd88e0')
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
      savedPosts: ['65fcc9307932c5551dfd88e0'],
      save: jest.fn()
    }
    PostModel.findOne = jest.fn().mockResolvedValue(post)
    UserModel.findOne = jest.fn().mockResolvedValue(user)

    await PostController.savePost(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: 'Post unsaved successfully' })
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
      savedPosts: ['65fcc9307932c5551dfd88e0'],
      save: jest.fn()
    }
    PostModel.findOne = jest.fn().mockResolvedValue(post)
    UserModel.findOne = jest.fn().mockResolvedValue(user)

    await PostController.savePost(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Post is already saved' })
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
    expect(res.json).toHaveBeenCalledWith({ message: 'Post is not saved' })
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
    expect(user.hiddenPosts).toContain('65fcc9307932c5551dfd88e0')
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
      hiddenPosts: ['65fcc9307932c5551dfd88e0'],
      save: jest.fn()
    }
    PostModel.findOne = jest.fn().mockResolvedValue(post)
    UserModel.findOne = jest.fn().mockResolvedValue(user)

    await PostController.hidePost(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: 'Post visibility changed successfully' })
    expect(user.hiddenPosts).not.toContain('65fcc9307932c5551dfd88e0')
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
    expect(user.hiddenPosts).not.toContain('65fcc9307932c5551dfd88e0')
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
      hiddenPosts: ['65fcc9307932c5551dfd88e0'],
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
      isModerator: false
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
      isNsfw: false
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
      type: 'Post'
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
      isModerator: false
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

    const post = [{
      _id: '55bb126babb335677998fbca',
      isDeleted: false,
      communityName: 'community1'
    }]

    const user = null

    PostModel.getPost = jest.fn().mockResolvedValue(post)
    PostModel.findOneAndUpdate = jest.fn()
    UserModel.findOne.mockResolvedValue(user)

    await getPost(req, res)

    expect(PostModel.getPost).toHaveBeenCalled()
    expect(PostModel.findOneAndUpdate).toHaveBeenCalled()
    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'user1', isDeleted: false })
    expect(HistoryModel.findOne).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      message: 'User does not exist'
    })
  })
})

describe('getHomeFeed', () => {
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
      mutedCommunities: []
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
      communities: [],
      mutedCommunities: []
    }

    UserModel.findOne = jest.fn().mockResolvedValue(user)
    PostModel.getSortedHomeFeed = jest.fn().mockResolvedValue([])

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    await getHomeFeed(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser', isDeleted: false })
    expect(PostModel.getSortedHomeFeed).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith([])
  })
})
