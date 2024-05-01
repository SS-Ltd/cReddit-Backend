const ChatMessageModel = require('../models/ChatMessage')
const ChatRoomModel = require('../models/ChatRoom')
const User = require('../models/User')
const { emitSocketEvent } = require('../utils/Socket')

const createChatRoom = async (req, res) => {
  try {
    const { name, members } = req.body
    console.log('Creating chat room: ', name, members)
    const host = req.decoded.username
    if (!name || !members) {
      return res.status(400).json({ message: 'Name and member/s are required' })
    }

    if (members.includes(host)) {
      return res.status(400).json({ message: 'Host cannot include himself in the members as he is already included by default' })
    }

    const chatRoom = new ChatRoomModel({
      name,
      members,
      host
    })

    await chatRoom.save()

    emitSocketEvent(req, chatRoom._id, 'chatRequest', { chatRoom })

    res.status(201).json({ message: 'Chat room created successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Error creating chat room: ' + error.message })
  }
}

const getRooms = async (req, res) => {
  try {
    const username = req.decoded.username
    const chatRooms = await ChatRoomModel.getRooms(username)

    if (!chatRooms) {
      return res.status(404).json({ message: 'No chat rooms found' })
    }

    res.status(200).json({ chatRooms })
  } catch (error) {
    res.status(500).json({ message: 'Error getting chat rooms: ' + error.message })
  }
}

const getRoomChat = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query
    const username = req.decoded.username
    const user = User.findOne({ username, isDeleted: false })
    const { roomID } = req.params
    const chatRoom = await ChatRoomModel.findById({ _id: roomID, isDeleted: false })
    if (!chatRoom) {
      return res.status(404).json({ message: 'Chat room not found' })
    }
    const chatMessages = await ChatMessageModel.find({ roomID }).sort({ createdAt: -1 }).limit(limit).skip((page - 1) * limit).exec()
    res.status(200).json({ chatMessages })
  } catch (error) {
    res.status(500).json({ message: 'Error getting chat room chat: ' + error.message })
  }
}

module.exports = {
  createChatRoom,
  getRooms,
  getRoomChat
}
