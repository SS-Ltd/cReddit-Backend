const ChatMessageModel = require('../models/ChatMessage')
const ChatRoomModel = require('../models/ChatRoom')
const UserModel = require('../models/User')

const createChatRoom = async (req, res) => {
  try {
    const { name, members } = req.body
    const host = req.decoded.username

    if (!members) {
      return res.status(400).json({ message: 'Members are required' })
    }

    if (!members.includes(host)) {
      members.push(host)
    }

    const membersSet = new Set(members)

    if (membersSet.size < 2) {
      return res.status(400).json({ message: 'Chat room must have at least 2 members' })
    } else if (membersSet.size === 2) {
      if (name) return res.status(400).json({ message: 'Name is not required for private chat' })
      const chatRoom = await ChatRoomModel.findOne({
        members: { $all: Array.from(membersSet) }
      })
      if (chatRoom) {
        return res.status(200).json({
          message: 'Chat room already exists',
          roomID: chatRoom._id
        })
      }
    } else if (membersSet.size > 2 && !name) {
      return res.status(400).json({ message: 'Name is required for group chat' })
    }

    const validUsers = await UserModel.find({
      username: { $in: Array.from(membersSet) }
    })

    if (validUsers.length !== membersSet.size) {
      return res.status(400).json({ message: 'Some members are not valid users' })
    }

    const chatRoom = new ChatRoomModel({
      name,
      members: Array.from(membersSet),
      host: membersSet.size === 2 ? null : host
    })

    await chatRoom.save()

    res.status(201).json({
      message: 'Chat room created successfully',
      roomID: chatRoom._id
    })
  } catch (error) {
    res.status(500).json({ message: 'Error creating chat room: ' + error.message })
  }
}

const getRooms = async (req, res) => {
  try {
    const username = req.decoded.username

    const user = UserModel.findOne({ username, isDeleted: false })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const chatRooms = await ChatRoomModel.getRooms(username)

    res.status(200).json(chatRooms)
  } catch (error) {
    res.status(500).json({ message: 'Error getting chat rooms: ' + error.message })
  }
}

const getRoomChat = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query
    const username = req.decoded.username
    const user = UserModel.findOne({ username, isDeleted: false })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const { roomId } = req.params

    const chatRoom = await ChatRoomModel.find({ roomId, isDeleted: false })

    if (!chatRoom) {
      return res.status(404).json({ message: 'Chat room not found' })
    }

    const chatMessages = await ChatMessageModel.find({ room: roomId }).sort({ createdAt: -1 }).limit(limit).skip((page - 1) * limit).exec()

    res.status(200).json(chatMessages)
  } catch (error) {
    res.status(500).json({ message: 'Error getting chat room chat: ' + error.message })
  }
}

module.exports = {
  createChatRoom,
  getRooms,
  getRoomChat
}
