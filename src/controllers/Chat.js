const ChatMessageModel = require('../models/ChatMessage')
const ChatRoomModel = require('../models/ChatRoom')
const UserModel = require('../models/User')

const createChatRoom = async (req, res) => {
  try {
    const { name, members } = req.body
    console.log('Creating chat room: ', name, members)
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

    const chatMessages = new ChatMessageModel({
      user: null,
      content: `${host} joined the chat`,
      room: chatRoom._id
    })

    await chatMessages.save()

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

    const chatRoom = await ChatRoomModel.find({ _id: roomId, isDeleted: false })

    if (!chatRoom) {
      return res.status(404).json({ message: 'Chat room not found' })
    }

    let chatMessages = null
    const findLeaveMessage = await ChatMessageModel.findOne({ room: roomId, content: `${username} left the chat` })
    if (findLeaveMessage) {
      // get the messagge before the leave message
      chatMessages = await ChatMessageModel.find({ room: roomId, createdAt: { $lt: findLeaveMessage.createdAt } }).sort({ createdAt: -1 }).limit(limit).skip((page - 1) * limit).exec()
    } else {
      chatMessages = await ChatMessageModel.find({ room: roomId }).sort({ createdAt: -1 }).limit(limit).skip((page - 1) * limit).exec()
    }

    res.status(200).json(chatMessages)
  } catch (error) {
    res.status(500).json({ message: 'Error getting chat room chat: ' + error.message })
  }
}

const leaveChatRoom = async (req, res) => {
  try {
    const username = req.decoded.username
    const { roomId } = req.params

    const chatRoom = await ChatRoomModel.findOne({ _id: roomId, isDeleted: false })

    if (!chatRoom) {
      return res.status(404).json({ message: 'Chat room not found' })
    }

    if (!chatRoom.members.includes(username)) {
      return res.status(403).json({ message: 'User is not a member of this chat room' })
    }

    const index = chatRoom.members.indexOf(username)
    chatRoom.members.splice(index, 1)

    await chatRoom.save()

    const chatMessage = new ChatMessageModel({
      user: null,
      content: `${username} left the chat`,
      room: roomId
    })

    await chatMessage.save()

    res.status(200).json({ message: 'Left chat room successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Error leaving chat room: ' + error.message })
  }
}

module.exports = {
  createChatRoom,
  getRooms,
  getRoomChat,
  leaveChatRoom
}
