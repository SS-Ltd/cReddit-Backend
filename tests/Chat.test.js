
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
const { createChatRoom, markAllMessagesAsRead, getRooms, getRoomChat } = require('../src/controllers/Chat')

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

  test('should create a chat room with valid name, at least 2 valid members, and host is included in members', async () => {
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

  test('should return 400 if some members have blocked each other', async () => {
    const mockedValidUsers = [{ username: 'user1' }, { username: 'user2' }]
    UserModel.find.mockResolvedValueOnce(mockedValidUsers)

    UserModel.find.mockImplementationOnce(() => [
      { username: 'user2', blockedUsers: [] }
    ])

    const req = {
      body: {
        members: ['user1', 'user2']
      },
      decoded: { username: 'user1' }
    }

    const res = {
      status: jest.fn(() => res),
      json: jest.fn()
    }

    await createChatRoom(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'some members have blocked each other' })
    expect(UserModel.find).toHaveBeenCalled()
    expect(ChatRoomModel.findOne).not.toHaveBeenCalled()
  })
})

describe('mark all messages as read', () => {
  // Successfully mark all unread messages as read for a given chat room
  test('should mark all unread messages as read when chat room is found', async () => {
    const req = {
      decoded: {
        username: 'testUser'
      },
      params: {
        roomId: 'testRoomId'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const chatRoom = {
      _id: 'testRoomId',
      members: ['testUser'],
      isDeleted: false
    }

    const updateManyMock = jest.spyOn(ChatMessageModel, 'updateMany').mockResolvedValueOnce()

    jest.spyOn(ChatRoomModel, 'findOne').mockResolvedValueOnce(chatRoom)

    await markAllMessagesAsRead(req, res)

    expect(ChatRoomModel.findOne).toHaveBeenCalledWith({ _id: 'testRoomId', members: 'testUser', isDeleted: false })
    expect(updateManyMock).toHaveBeenCalledWith({ room: 'testRoomId', isRead: false }, { isRead: true })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: 'All messages marked as read' })
  })

  test('should return an error message with status code 404 when chat room is not found', async () => {
    const req = {
      decoded: {
        username: 'testUser'
      },
      params: {
        roomId: 'testRoomId'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    jest.spyOn(ChatRoomModel, 'findOne').mockResolvedValueOnce(null)

    await markAllMessagesAsRead(req, res)

    expect(ChatRoomModel.findOne).toHaveBeenCalledWith({ _id: 'testRoomId', members: 'testUser', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ message: 'Chat room not found' })
  })

  test('should return a 404 status code and an error message when user is not a member of the chat room', async () => {
    const req = {
      decoded: {
        username: 'testUser'
      },
      params: {
        roomId: 'testRoomId'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    jest.spyOn(ChatRoomModel, 'findOne').mockResolvedValueOnce(null)

    await markAllMessagesAsRead(req, res)

    expect(ChatRoomModel.findOne).toHaveBeenCalledWith({ _id: 'testRoomId', members: 'testUser', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ message: 'Chat room not found' })
  })

  test('should return a 500 status code and an error message when username is not provided', async () => {
    const req = {
      params: {
        roomId: 'testRoomId'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    await markAllMessagesAsRead(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ message: "Error marking all messages as read: Cannot read properties of undefined (reading 'username')" })
  })
})

describe('getRooms', () => {
  test('should return a list of chat rooms for a valid user with default pagination', async () => {
    const req = {
      decoded: {
        username: 'testUser'
      },
      query: {}
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    UserModel.findOne = jest.fn().mockResolvedValue({ username: 'testUser', isDeleted: false })
    ChatRoomModel.getRooms = jest.fn().mockResolvedValue(['room1', 'room2'])

    await getRooms(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser', isDeleted: false })
    expect(ChatRoomModel.getRooms).toHaveBeenCalledWith(0, 10, 'testUser')
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(['room1', 'room2'])
  })

  test('should return a list of chat rooms for a valid user with custom pagination', async () => {
    const req = {
      query: {
        page: 2,
        limit: 5
      },
      decoded: {
        username: 'testUser'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    UserModel.findOne = jest.fn().mockResolvedValue({ username: 'testUser', isDeleted: false })
    ChatRoomModel.getRooms = jest.fn().mockResolvedValue(['room1', 'room2', 'room3', 'room4', 'room5'])

    await getRooms(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser', isDeleted: false })
    expect(ChatRoomModel.getRooms).toHaveBeenCalledWith(1, 5, 'testUser')
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(['room1', 'room2', 'room3', 'room4', 'room5'])
  })

  test('should return a 404 error for an invalid user', async () => {
    const req = {
      query: {},
      decoded: {
        username: 'invalidUser'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    UserModel.findOne = jest.fn().mockResolvedValue(null)

    await getRooms(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'invalidUser', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' })
  })

  test('should return a 500 error when an unexpected error occurs', async () => {
    const req = {
      query: {}
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    UserModel.findOne = jest.fn().mockResolvedValue(null)
    ChatRoomModel.getRooms = jest.fn().mockRejectedValue(new Error('Unexpected error'))

    await getRooms(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ message: "Error getting chat rooms: Cannot read properties of undefined (reading 'username')" })
  })
})

describe('getRoomChat', () => {
  test('should return chat messages for a valid room ID and user', async () => {
    const req = {
      query: {
        page: 1,
        limit: 10
      },
      decoded: {
        username: 'testUser'
      },
      params: {
        roomId: 'validRoomId'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    UserModel.findOne = jest.fn().mockResolvedValue({ username: 'testUser', isDeleted: false })
    ChatRoomModel.find = jest.fn().mockResolvedValue([{ _id: 'validRoomId', isDeleted: false }])
    ChatMessageModel.findOne = jest.fn().mockResolvedValue(null)
    ChatMessageModel.getChatMessages = jest.fn().mockResolvedValue(['message1', 'message2'])

    await getRoomChat(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser', isDeleted: false })
    expect(ChatRoomModel.find).toHaveBeenCalledWith({ _id: 'validRoomId', isDeleted: false })
    expect(ChatMessageModel.findOne).toHaveBeenCalledWith({ room: 'validRoomId', content: 'testUser left the chat' })
    expect(ChatMessageModel.getChatMessages).toHaveBeenCalledWith(0, 10, 'validRoomId', expect.any(Date))
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(['message2', 'message1'])
  })

  test('should return 404 for invalid room ID', async () => {
    const req = {
      query: {
        page: 1,
        limit: 10
      },
      decoded: {
        username: 'testUser'
      },
      params: {
        roomId: 'invalidRoomId'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    UserModel.findOne = jest.fn().mockResolvedValue({ username: 'testUser', isDeleted: false })
    ChatRoomModel.find = jest.fn().mockResolvedValue(null)
    ChatMessageModel.findOne = jest.fn().mockResolvedValue(null)

    await getRoomChat(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser', isDeleted: false })
    expect(ChatRoomModel.find).toHaveBeenCalledWith({ _id: 'invalidRoomId', isDeleted: false })
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ message: 'Chat room not found' })
  })

  test('should return 404 for user not found', async () => {
    const req = {
      query: {
        page: 1,
        limit: 10
      },
      decoded: {
        username: 'testUser'
      },
      params: {
        roomId: 'validRoomId'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    UserModel.findOne = jest.fn().mockResolvedValue(null)
    ChatRoomModel.find = jest.fn().mockResolvedValue([{ _id: 'validRoomId', isDeleted: false }])
    ChatMessageModel.findOne = jest.fn().mockResolvedValue(null)
    ChatMessageModel.getChatMessages = jest.fn().mockResolvedValue(['message1', 'message2'])

    await getRoomChat(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser', isDeleted: false })
    expect(ChatRoomModel.find).not.toHaveBeenCalled()
    expect(ChatMessageModel.findOne).not.toHaveBeenCalled()
    expect(ChatMessageModel.getChatMessages).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' })
  })

  it('should return 500 for server error', async () => {
    const req = {
      query: {
        page: 1,
        limit: 10
      },
      decoded: {
        username: 'testUser'
      },
      params: {
        roomId: 'validRoomId'
      }
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    UserModel.findOne = jest.fn().mockRejectedValue(new Error('Database error'))
    ChatRoomModel.find = jest.fn().mockResolvedValue([{ _id: 'validRoomId', isDeleted: false }])
    ChatMessageModel.findOne = jest.fn().mockResolvedValue(null)
    ChatMessageModel.getChatMessages = jest.fn().mockResolvedValue(['message1', 'message2'])

    await getRoomChat(req, res)

    expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testUser', isDeleted: false })
    expect(ChatRoomModel.find).not.toHaveBeenCalled()
    expect(ChatMessageModel.findOne).not.toHaveBeenCalled()
    expect(ChatMessageModel.getChatMessages).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ message: 'Error getting chat room chat: Database error' })
  })
})
