const MessageModel = require('../src/models/Message')
const UserModel = require('../src/models/User')
const CommunityModel = require('../src/models/Community')
const { createMessage, getMessages, markAsRead, markAllAsRead, getSentMessages, getPostReplies, getUsernameMentions, deleteMessage, getUnreadMessages, getInbox } = require('../src/controllers/Message')
const { sendMessage } = require('../src/utils/Message')

jest.mock('../src/models/Message')
jest.mock('../src/models/User')
jest.mock('../src/utils/Message')

describe('createMessage', () => {
  test('should create a message when data is valid', async () => {
    const req = {
      body: {
        to: 'testUser',
        subject: 'testSubject',
        text: 'testText'
      },
      decoded: {
        username: 'testReceiver'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    UserModel.findOne.mockResolvedValueOnce({ isDeleted: false })

    await createMessage(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
  })

  test('should throw an error when receiver user is not found', async () => {
    const req = {
      body: {
        to: 'testUser',
        subject: 'testSubject',
        text: 'testText'
      },
      decoded: {
        username: 'testReceiver'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    UserModel.findOne.mockResolvedValueOnce(null)

    await createMessage(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
  })
})

describe('getMessages', () => {
  test('should get messages when data is valid', async () => {
    const req = {
      decoded: {
        username: 'testUser'
      },
      query: {
        page: 1,
        limit: 25
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    }

    const messagesData = [{ isDeleted: false, isRead: false, subject: 'testSubject' }]
    messagesData.map = jest.fn().mockReturnValueOnce(messagesData)
    messagesData.forEach = jest.fn()

    const sortMock = jest.fn(() => ({
      skip: jest.fn(() => ({
        limit: jest.fn().mockReturnValueOnce(messagesData)
      }))
    }))

    MessageModel.find = jest.fn().mockReturnValueOnce({
      sort: sortMock
    })

    await getMessages(req, res)

    expect(MessageModel.find).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })

  test('should return 404 when no messages are found', async () => {
    const req = {
      decoded: {
        username: 'testUser'
      },
      query: {
        page: 1,
        limit: 25
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    }

    const messagesData = []
    messagesData.map = jest.fn().mockReturnValueOnce(messagesData)
    messagesData.forEach = jest.fn()

    const sortMock = jest.fn(() => ({
      skip: jest.fn(() => ({
        limit: jest.fn().mockReturnValueOnce(messagesData)
      }))
    }))

    MessageModel.find = jest.fn().mockReturnValueOnce({
      sort: sortMock
    })

    await getMessages(req, res)

    expect(MessageModel.find).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(404)
  })

  test('should throw error when messages are null', async () => {
    const req = {
      decoded: {
        username: 'testUser'
      },
      query: {
        page: 1,
        limit: 25
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    }

    MessageModel.find = jest.fn().mockReturnValueOnce(null)

    await getMessages(req, res)

    expect(MessageModel.find).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
  })
})

describe('getInbox', () => {
  test('should get inbox messages when data is valid', async () => {
    const req = {
      decoded: {
        username: 'testUser'
      },
      query: {
        page: 1,
        limit: 25
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    }

    const messagesData = [{ isDeleted: false }]
    messagesData.map = jest.fn().mockReturnValueOnce(messagesData)

    const sortMock = jest.fn(() => ({
      skip: jest.fn(() => ({
        limit: jest.fn().mockReturnValueOnce(messagesData)
      }))
    }))

    MessageModel.find = jest.fn().mockReturnValueOnce({
      sort: sortMock
    })

    await getInbox(req, res)

    expect(MessageModel.find).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })

  test('should return 404 when no messages are found', async () => {
    const req = {
      decoded: {
        username: 'testUser'
      },
      query: {
        page: 1,
        limit: 25
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    }

    const messagesData = []
    messagesData.map = jest.fn().mockReturnValueOnce(messagesData)

    const sortMock = jest.fn(() => ({
      skip: jest.fn(() => ({
        limit: jest.fn().mockReturnValueOnce(messagesData)
      }))
    }))

    MessageModel.find = jest.fn().mockReturnValueOnce({
      sort: sortMock
    })

    await getInbox(req, res)

    expect(MessageModel.find).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(404)
  })

  test('should throw error when messages are null', async () => {
    const req = {
      decoded: {
        username: 'testUser'
      },
      query: {
        page: 1,
        limit: 25
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    }

    MessageModel.find = jest.fn().mockReturnValueOnce(null)

    await getInbox(req, res)

    expect(MessageModel.find).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
  })
})

describe('getUnreadMessages', () => {
  test('should get unread messages when data is valid', async () => {
    const req = {
      decoded: {
        username: 'testUser'
      },
      query: {
        page: 1,
        limit: 25
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    }

    const messagesData = [{ isRead: false, isDeleted: false, subject: 'testSubject' }]
    messagesData.map = jest.fn().mockReturnValueOnce(messagesData)

    const sortMock = jest.fn(() => ({
      skip: jest.fn(() => ({
        limit: jest.fn().mockReturnValueOnce(messagesData)
      }))
    }))

    MessageModel.find = jest.fn().mockReturnValueOnce({
      sort: sortMock
    })

    await getUnreadMessages(req, res)

    expect(MessageModel.find).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })

  test('should return 404 when no messages are found', async () => {
    const req = {
      decoded: {
        username: 'testUser'
      },
      query: {
        page: 1,
        limit: 25
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    }

    const messagesData = []
    messagesData.map = jest.fn().mockReturnValueOnce(messagesData)

    const sortMock = jest.fn(() => ({
      skip: jest.fn(() => ({
        limit: jest.fn().mockReturnValueOnce(messagesData)
      }))
    }))

    MessageModel.find = jest.fn().mockReturnValueOnce({
      sort: sortMock
    })

    await getUnreadMessages(req, res)

    expect(MessageModel.find).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(404)
  })

  test('should throw error when messages are null', async () => {
    const req = {
      decoded: {
        username: 'testUser'
      },
      query: {
        page: 1,
        limit: 25
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    }

    MessageModel.find = jest.fn().mockReturnValueOnce(null)

    await getUnreadMessages(req, res)

    expect(MessageModel.find).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
  })
})

describe('getSentMessages', () => {
  test('should get sent messages when data is valid', async () => {
    const req = {
      decoded: {
        username: 'testUser'
      },
      query: {
        page: 1,
        limit: 25
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    }

    const messagesData = [{ isDeleted: false }]
    messagesData.map = jest.fn().mockReturnValueOnce(messagesData)

    const sortMock = jest.fn(() => ({
      skip: jest.fn(() => ({
        limit: jest.fn().mockReturnValueOnce(messagesData)
      }))
    }))

    MessageModel.find = jest.fn().mockReturnValueOnce({
      sort: sortMock
    })

    await getSentMessages(req, res)

    expect(MessageModel.find).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })

  test('should return 404 when no messages are found', async () => {
    const req = {
      decoded: {
        username: 'testUser'
      },
      query: {
        page: 1,
        limit: 25
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    }

    const messagesData = []
    messagesData.map = jest.fn().mockReturnValueOnce(messagesData)

    const sortMock = jest.fn(() => ({
      skip: jest.fn(() => ({
        limit: jest.fn().mockReturnValueOnce(messagesData)
      }))
    }))

    MessageModel.find = jest.fn().mockReturnValueOnce({
      sort: sortMock
    })

    await getSentMessages(req, res)

    expect(MessageModel.find).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(404)
  })

  test('should throw error when messages are null', async () => {
    const req = {
      decoded: {
        username: 'testUser'
      },
      query: {
        page: 1,
        limit: 25
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    }

    MessageModel.find = jest.fn().mockReturnValueOnce(null)

    await getSentMessages(req, res)

    expect(MessageModel.find).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
  })
})

describe('getPostReplies', () => {
  test('should get post replies when data is valid', async () => {
    const req = {
      decoded: {
        username: 'testUser'
      },
      query: {
        page: 1,
        limit: 10
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    }

    UserModel.findOne.mockResolvedValueOnce({ isDeleted: false })

    const messagesData = [{ isDeleted: false, subject: 'post reply: testSubject' }]

    MessageModel.find = jest.fn().mockReturnValueOnce({
      sort: jest.fn(() => ({
        skip: jest.fn(() => ({
          limit: jest.fn(() => ({
            exec: jest.fn().mockResolvedValueOnce(messagesData)
          }))
        }))
      }))
    })

    await getPostReplies(req, res)

    expect(MessageModel.find).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })
  test('should return 404 when user is not found', async () => {
    const req = {
      decoded: {
        username: 'testUser'
      },
      query: {
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    }

    UserModel.findOne.mockResolvedValueOnce(null)

    await getPostReplies(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  test('should throw error when messages are null', async () => {
    const req = {
      decoded: {
        username: 'testUser'
      },
      query: {
        page: 1,
        limit: 10
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    }

    UserModel.findOne.mockResolvedValueOnce({ isDeleted: false })

    MessageModel.find = jest.fn().mockReturnValueOnce(null)

    await getPostReplies(req, res)

    expect(MessageModel.find).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('getUsernameMentions', () => {
  test('should get username mentions when data is valid', async () => {
    const req = {
      decoded: {
        username: 'testUser'
      },
      query: {
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    }

    UserModel.findOne.mockResolvedValueOnce({ isDeleted: false })

    const messagesData = [{ isDeleted: false, subject: 'Mentioned testSubject' }]

    MessageModel.find = jest.fn().mockReturnValueOnce({
      sort: jest.fn(() => ({
        skip: jest.fn(() => ({
          limit: jest.fn(() => ({
            exec: jest.fn().mockResolvedValueOnce(messagesData)
          }))
        }))
      }))
    })

    await getUsernameMentions(req, res)

    expect(MessageModel.find).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })

  test('should return 404 when user is not found', async () => {
    const req = {
      decoded: {
        username: 'testUser'
      },
      query: {
        page: 1,
        limit: 10
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    }

    UserModel.findOne.mockResolvedValueOnce(null)

    await getUsernameMentions(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  test('should throw error when messages are null', async () => {
    const req = {
      decoded: {
        username: 'testUser'
      },
      query: {
        page: 1,
        limit: 10
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    }

    UserModel.findOne.mockResolvedValueOnce({ isDeleted: false })

    MessageModel.find = jest.fn().mockReturnValueOnce(null)

    await getUsernameMentions(req, res)

    expect(MessageModel.find).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('markAsRead', () => {
  test('should mark message as read when data is valid', async () => {
    const req = {
      params: {
        messageId: 'testMessageId'
      },
      decoded: {
        username: 'testUser'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    }

    const message = {
      isDeleted: false,
      to: 'testUser',
      save: jest.fn()
    }

    MessageModel.findOne = jest.fn().mockResolvedValueOnce(message)

    await markAsRead(req, res)

    expect(MessageModel.findOne).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })

  test('should return 404 when message is not found', async () => {
    const req = {
      params: {
        messageId: 'testMessageId'
      },
      decoded: {
        username: 'testUser'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    }

    MessageModel.findOne = jest.fn().mockResolvedValueOnce(null)

    await markAsRead(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  test('should return 400 when message.isRead is null', async () => {
    const req = {
      params: {
        messageId: 'testMessageId'
      },
      decoded: {
        username: 'testUser'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    }

    MessageModel.findOne = jest.fn().mockReturnValueOnce({})

    await markAsRead(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
  })
})

describe('markAllAsRead', () => {
  test('should mark all messages as read when data is valid', async () => {
    const req = {
      decoded: {
        username: 'testUser'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    }

    const messages = [{ isDeleted: false, to: 'testUser', isRead: false }]
    messages.forEach = jest.fn()

    MessageModel.find = jest.fn().mockResolvedValueOnce(messages)

    await markAllAsRead(req, res)

    expect(MessageModel.find).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })

  test('should return 400 when messages are null', async () => {
    const req = {
      decoded: {
        username: 'testUser'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    }

    MessageModel.find = jest.fn().mockReturnValueOnce(null)

    await markAllAsRead(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
  })
})

describe('deleteMessage', () => {
  test('should delete message when data is valid', async () => {
    const req = {
      params: {
        messageId: 'testMessageId'
      },
      decoded: {
        username: 'testUser'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    }

    const message = {
      isDeleted: false,
      to: 'testUser',
      save: jest.fn()
    }

    MessageModel.findOne = jest.fn().mockResolvedValueOnce(message)

    await deleteMessage(req, res)

    expect(MessageModel.findOne).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })

  test('should return 200 when message is not found', async () => {
    const req = {
      params: {
        messageId: 'testMessageId'
      },
      decoded: {
        username: 'testUser'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    }

    MessageModel.findOne = jest.fn().mockResolvedValueOnce(null)

    await deleteMessage(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
  })

  test('should return 400 when message.isDeleted is null', async () => {
    const req = {
      params: {
        messageId: 'testMessageId'
      },
      decoded: {
        username: 'testUser'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    }

    MessageModel.findOne = jest.fn().mockReturnValueOnce({})

    await deleteMessage(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
  })
})

describe('sendMessage', () => {
  const { sendMessage } = jest.requireActual('../src/utils/Message')

  test('should successfully send a message from sender (community) to receiver', async () => {
    UserModel.findOne = jest.fn().mockResolvedValueOnce({ username: 'sender' }).mockResolvedValueOnce({ username: '/r/receiver' }).mockResolvedValueOnce({ username: 'mod1', blockedUsers: [], preferences: { inboxMessages: true } })

    CommunityModel.findOne = jest.fn().mockReturnValueOnce({ name: 'communityName', bannedUsers: [], mutedUsers: [], moderators: ['mod1'] })

    const mockMessage = { _id: 'messageId', save: jest.fn().mockResolvedValue(true) }
    MessageModel.mockReturnValue(mockMessage)

    const result = await sendMessage('sender', '/r/receiver', 'subject', 'text', true)

    expect(result).toBe(undefined)
  })

  test('should successfully send a message from sender (user) to receiver', async () => {
    UserModel.findOne = jest.fn().mockResolvedValueOnce({ username: 'sender' }).mockResolvedValueOnce({ username: 'receiver', blockedUsers: [], preferences: { inboxMessages: true } })

    const mockMessage = { _id: 'messageId', save: jest.fn().mockResolvedValue(true) }
    MessageModel.mockReturnValue(mockMessage)

    const result = await sendMessage('sender', 'receiver', 'subject', 'text', true)

    expect(result).toBe('messageId')
  })

  test('should throw an error if community does not exist', async () => {
    UserModel.findOne = jest.fn().mockResolvedValueOnce({ username: 'sender' })

    CommunityModel.findOne = jest.fn().mockReturnValueOnce(null)

    const mockMessage = { _id: 'messageId', save: jest.fn().mockResolvedValue(true) }
    MessageModel.mockReturnValue(mockMessage)

    expect(sendMessage('sender', '/r/receiver', 'subject', 'text', true)).rejects.toThrow('Community not found')
  })

  test('should throw an error if user is banned from community', async () => {
    UserModel.findOne = jest.fn().mockResolvedValueOnce({ username: 'sender' })

    CommunityModel.findOne = jest.fn().mockReturnValueOnce({ name: 'communityName', bannedUsers: ['sender'], mutedUsers: [], moderators: [] })

    const mockMessage = { _id: 'messageId', save: jest.fn().mockResolvedValue(true) }
    MessageModel.mockReturnValue(mockMessage)

    expect(sendMessage('sender', '/r/receiver', 'subject', 'text', true)).rejects.toThrow('User is banned from community')
  })

  test('should throw an error if user is muted in community', async () => {
    UserModel.findOne = jest.fn().mockResolvedValueOnce({ username: 'sender' })

    CommunityModel.findOne = jest.fn().mockReturnValueOnce({ name: 'communityName', bannedUsers: [], mutedUsers: ['sender'], moderators: [] })

    const mockMessage = { _id: 'messageId', save: jest.fn().mockResolvedValue(true) }
    MessageModel.mockReturnValue(mockMessage)

    expect(sendMessage('sender', '/r/receiver', 'subject', 'text', true)).rejects.toThrow('User is muted in community')
  })

  test('should throw an error if user does not exist', async () => {
    UserModel.findOne = jest.fn().mockResolvedValueOnce(null)

    const mockMessage = { _id: 'messageId', save: jest.fn().mockResolvedValue(true) }
    MessageModel.mockReturnValue(mockMessage)

    expect(sendMessage('sender', 'receiver', 'subject', 'text', true)).rejects.toThrow('User not found')
  })

  test('should throw an error if user is blocked', async () => {
    UserModel.findOne = jest.fn().mockResolvedValueOnce({ username: 'sender' }).mockResolvedValueOnce({ username: 'receiver', blockedUsers: ['sender'], preferences: { inboxMessages: true } })

    const mockMessage = { _id: 'messageId', save: jest.fn().mockResolvedValue(true) }
    MessageModel.mockReturnValue(mockMessage)

    expect(sendMessage('sender', 'receiver', 'subject', 'text', true)).rejects.toThrow('Unable to send message to blocked user')
  })

  test('should throw an error if user does not accept messages', async () => {
    UserModel.findOne = jest.fn().mockResolvedValueOnce({ username: 'sender' }).mockResolvedValueOnce({ username: 'receiver', blockedUsers: [], preferences: { inboxMessages: false } })

    const mockMessage = { _id: 'messageId', save: jest.fn().mockResolvedValue(true) }
    MessageModel.mockReturnValue(mockMessage)

    expect(sendMessage('sender', 'receiver', 'subject', 'text', true)).rejects.toThrow('User does not accept messages')
  })
})
