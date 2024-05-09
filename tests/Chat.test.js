
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn()
  },
  messaging: () => ({
    sendMulticast: jest.fn()
  })
}))

const ChatRoomModel = require('../src/models/ChatRoom')
const UserModel = require('../src/models/User')
const ChatMessageModel = require('../src/models/ChatMessage')
const { createChatRoom } = require('../src/controllers/Chat')

// Mock dependencies
jest.mock('../src/models/ChatRoom')
jest.mock('../src/models/User')
jest.mock('../src/models/ChatMessage')
jest.mock('../src/utils/Notification', () => ({
  sendNotification: jest.fn()
}))
const { sendNotification } = require('../src/utils/Notification')

describe('createChatRoom', () => {
  ChatRoomModel.prototype.save = jest.fn().mockResolvedValue({
    _id: 'some-id',
    name: 'Chat Room 1',
    members: ['user1', 'user2'],
    host: 'host'
  })
  test('should create a chat room with valid name and at least 2 valid members', async () => {
    const req = {
      body: {
        members: ['user1', 'user2']
      },
      decoded: {
        username: 'user1'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    UserModel.find = jest.fn().mockImplementation((query) => {
      if (query.username.$in.includes('user1') && query.username.$in.includes('user2')) {
        return Promise.resolve([
          { username: 'user1', blockedUsers: [], isDeleted: false },
          { username: 'user2', blockedUsers: [], isDeleted: false }
        ])
      }
      return Promise.resolve([])
    })
    ChatRoomModel.findOne = jest.fn().mockResolvedValue(null)
    ChatRoomModel.prototype.save = jest.fn().mockResolvedValue()
    ChatMessageModel.prototype.save = jest.fn().mockResolvedValue()
    UserModel.findOne = jest.fn().mockResolvedValue({ username: 'user1', isDeleted: false })
    sendNotification.mockResolvedValue()

    await createChatRoom(req, res)

    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalled()
  })

  test('should return an error message when creating a chat room with no members', async () => {
    const req = {
      body: {
        name: 'Chat Room 1'
      },
      decoded: {
        username: 'host'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    await createChatRoom(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Members are required' })
  })

  it('should create a chat room with valid name, at least 2 valid members, and host is included in members', async () => {
    const req = {
      body: {
        name: 'Chat Room',
        members: ['user1', 'user2', 'host']
      },
      decoded: {
        username: 'host'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    UserModel.find = jest.fn().mockImplementation((query) => {
      if (query.username.$in.includes('user1') && query.username.$in.includes('user2') && query.username.$in.includes('host')) {
        return Promise.resolve([
          { username: 'user1', blockedUsers: [], isDeleted: false },
          { username: 'user2', blockedUsers: [], isDeleted: false },
          { username: 'host', blockedUsers: [], isDeleted: false }
        ])
      }
      return Promise.resolve([])
    })
    ChatRoomModel.findOne = jest.fn().mockResolvedValue(null)
    ChatRoomModel.prototype.save = jest.fn().mockResolvedValue()
    ChatMessageModel.prototype.save = jest.fn().mockResolvedValue()
    UserModel.findOne = jest.fn().mockResolvedValue({ username: 'user1' })
    sendNotification.mockResolvedValue()

    await createChatRoom(req, res)

    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalled()
  })
})
