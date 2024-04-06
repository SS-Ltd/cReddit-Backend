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

    PostModel.findOne = jest.fn().mockResolvedValue({ type: 'Post', name: 'Test Post', communityName: 'Test Community' })

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

    PostModel.findOne = jest.fn().mockResolvedValue({ type: 'Post', name: 'Test Post', communityName: 'Test Community' })

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
      files: []
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    PostModel.findOne = jest.fn().mockResolvedValue({
      _id: 'validCommentId',
      type: 'Comment',
      isImage: false,
      save: jest.fn()
    })
    MediaUtils.deleteImages = jest.fn().mockResolvedValue()
    MediaUtils.uploadImages = jest.fn().mockResolvedValue([])

    await comment.editComment(req, res)

    expect(PostModel.findOne).toHaveBeenCalledWith({ _id: '660d7e17baa5c72965311c7f' })
    expect(MediaUtils.deleteImages).not.toHaveBeenCalled()
    expect(MediaUtils.uploadImages).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Comment edited successfully',
      commentId: 'validCommentId'
    })
  })

  it('should throw an error when attempting to edit a non-existing comment', async () => {
    const req = {
      params: {
        commentId: '660d7e17baa5c72965311c7f'
      },
      body: {
        content: 'new comment content'
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
      files: [{ filename: 'image.jpg' }]
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    PostModel.findOne = jest.fn().mockResolvedValue({
      _id: '660d7e17baa5c72965311c7f',
      type: 'Comment',
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
      files: [{ filename: 'image.jpg' }]
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    PostModel.findOne = jest.fn().mockResolvedValue({
      _id: '660d7e17baa5c72965311c7f',
      type: 'Comment',
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
      files: []
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    PostModel.findOne = jest.fn().mockResolvedValue({
      _id: '660d7e17baa5c72965311c7f',
      type: 'Comment',
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
