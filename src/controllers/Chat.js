const ChatMessageModel = require('../models/ChatMessage')
const ChatRoomModel = require('../models/ChatRoom')
const User = require('../models/User')

const createChatRoom = async (req, res) => {
  try {
    const { name, members } = req.body
    const host = req.decoded.username
    if (!name || !members) {
      return res.status(400).json({ message: 'Name and member/s are required' })
    }

    if (!members.includes(host)) {
      members.push(host)
    }

    const membersSet = new Set(members)

    const chatRoom = new ChatRoomModel({
      name,
      members: Array.from(membersSet),
      host
    })

    await chatRoom.save()

    res.status(201).json({ message: 'Chat room created successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Error creating chat room: ' + error.message })
  }
}

const getRooms = async (req, res) => {
  try {
    const username = req.decoded.username

    const user = User.findOne({ username, isDeleted: false })

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
    const user = User.findOne({ username, isDeleted: false })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const { roomID } = req.params

    const chatRoom = await ChatRoomModel.findById({ roomID, isDeleted: false })

    if (!chatRoom) {
      return res.status(404).json({ message: 'Chat room not found' })
    }

    const chatMessages = await ChatMessageModel.find({ roomID }).sort({ createdAt: -1 }).limit(limit).skip((page - 1) * limit).exec()

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
