const comment = require('../src/controllers/Comment')
const PostModel = require('../src/models/Post')
const MediaUtils = require('../src/utils/Media')

jest.mock('../src/models/Post', () => {
  return jest.fn().mockImplementation(() => {
    return {
      save: jest.fn(),
      deleteOne: jest.fn()
    }
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

    PostModel.findOne = jest.fn().mockResolvedValue({ name: 'Test Post', communityName: 'Test Community' })

    await comment.createComment(req, res)

    expect(PostModel).toHaveBeenCalledWith({
      type: 'Comment',
      username: 'Test User',
      communityName: 'Test Community',
      content: 'Test Comment',
      postID: '660d7e17baa5c72965311c7f',
      isImage: false
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

    PostModel.findOne = jest.fn().mockResolvedValue({ name: 'Test Post', communityName: 'Test Community' })

    MediaUtils.cloudinary.uploader.upload = jest.fn().mockResolvedValue({ secure_url: 'secure_url' })

    await comment.createComment(req, res)

    expect(PostModel).toHaveBeenCalledWith({
      type: 'Comment',
      username: 'Test User',
      communityName: 'Test Community',
      content: 'secure_url',
      postID: '660d7e17baa5c72965311c7f',
      isImage: true
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

    PostModel.findOne = jest.fn().mockResolvedValue({ name: 'Test Post', communityName: 'Test Community' })

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

  test('should not create a comment for a non-existing post', async () => {
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

    MediaUtils.cloudinary.uploader.upload = jest.fn().mockResolvedValue({ secure_url: 'secure_url' })

    await comment.createComment(req, res)

    expect(PostModel).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Cannot comment on a non-existing post' })
  })
})
