const ChatMessageModel = require('../models/ChatMessage')
const ChatRoomModel = require('../models/ChatRoom')
const UserModel = require('../models/User')
const { sendNotification } = require('../utils/Notification')

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
    const validUsers = await UserModel.find({
      username: { $in: Array.from(membersSet) }
    })

    if (validUsers.length !== membersSet.size) {
      return res.status(400).json({ message: 'Some members are not valid users' })
    }

    if (membersSet.size < 2) {
      return res.status(400).json({ message: 'Chat room must have at least 2 members' })
    } else if (membersSet.size === 2) {
      if (name) return res.status(400).json({ message: 'Name is not required for private chat' })
      const membersArray = Array.from(membersSet)
      const users = await UserModel.find({
        username: { $in: membersArray },
        blockedUsers: { $not: { $elemMatch: { $in: membersArray } } },
        isDeleted: false
      })

      if (users.length !== 2) {
        return res.status(400).json({ message: 'some members have blocked each other' })
      }

      const chatRoom = await ChatRoomModel.findOne({
        members: { $all: membersArray, $size: membersArray.length }
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

    const chatRoom = new ChatRoomModel({
      name,
      members: Array.from(membersSet),
      host: membersSet.size === 2 ? null : host
    })

    await chatRoom.save()

    const chatMessages = new ChatMessageModel({
      user: null,
      content: `${host} joined the chat`,
      room: chatRoom._id,
      isRead: false
    })

    await chatMessages.save()

    for (const member of Array.from(membersSet)) {
      const user = await UserModel.findOne({ username: member, isDeleted: false })
      if (user && user.username !== host) {
        sendNotification(user.username, 'chatRequest', chatRoom, host)
      }
    }

    res.status(201).json({
      message: 'Chat room created successfully',
      roomID: chatRoom._id
    })
  } catch (error) {
    res.status(500).json({ message: 'Error creating chat room: ' + error.message })
  }
}

const markAllMessagesAsRead = async (req, res) => {
  try {
    const username = req.decoded.username
    const { roomId } = req.params

    const chatRoom = await ChatRoomModel
      .findOne({ _id: roomId, members: username, isDeleted: false })

    if (!chatRoom) {
      return res.status(404).json({ message: 'Chat room not found' })
    }

    await ChatMessageModel.updateMany(
      { room: roomId, isRead: false },
      { isRead: true }
    )

    res.status(200).json({ message: 'All messages marked as read' })
  } catch (error) {
    res.status(500).json({ message: 'Error marking all messages as read: ' + error.message })
  }
}

const getRooms = async (req, res) => {
  try {
    const page = parseInt(req.query.page) - 1 || 0
    const limit = parseInt(req.query.limit) || 10
    const username = req.decoded.username

    const user = await UserModel.findOne({ username, isDeleted: false })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const chatRooms = await ChatRoomModel.getRooms(page, limit, username)

    res.status(200).json(chatRooms)
  } catch (error) {
    res.status(500).json({ message: 'Error getting chat rooms: ' + error.message })
  }
}

const getRoomChat = async (req, res) => {
  try {
    const page = parseInt(req.query.page) - 1 || 0
    const limit = parseInt(req.query.limit) || 10
    const username = req.decoded.username
    const user = await UserModel.findOne({ username, isDeleted: false })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const { roomId } = req.params

    const chatRoom = await ChatRoomModel.find({ _id: roomId, isDeleted: false })

    if (!chatRoom) {
      return res.status(404).json({ message: 'Chat room not found' })
    }

    const findLeaveMessage = await ChatMessageModel.findOne({ room: roomId, content: `${username} left the chat` })

    const chatMessages = await ChatMessageModel.getChatMessages(page, limit, roomId, findLeaveMessage?.createdAt || new Date())

    res.status(200).json(chatMessages.reverse())
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

    if (!chatRoom.name) {
      return res.status(403).json({ message: 'Cannot leave private chat room' })
    }

    const index = chatRoom.members.indexOf(username)
    chatRoom.members = chatRoom.members.splice(index, 1)

    await chatRoom.save()

    const chatMessage = new ChatMessageModel({
      user: null,
      content: `${username} left the chat`,
      room: roomId,
      isRead: false
    })

    await chatMessage.save()

    res.status(200).json({ message: 'Left chat room successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Error leaving chat room: ' + error.message })
  }
}

module.exports = {
  createChatRoom,
  markAllMessagesAsRead,
  getRooms,
  getRoomChat,
  leaveChatRoom
}
