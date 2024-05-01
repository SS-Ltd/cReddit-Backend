const ChatMessageModel = require('../models/ChatMessage')
const ChatRoomModel = require('../models/ChatRoom')
const UserModel = require('../models/User')

const connectSocket = (io) => {
  console.log('Connecting to the server: ', io)
  return io.on('connection', (socket) => {
    console.log('Connected to the server')

    socket.on('disconnect', () => {
      console.log('Disconnected from the server')
    })

    socket.on('chatMessage', async (data) => { // data = { roomId, message }
      console.log('Message: ', data)
      const { username, roomId, message } = data

      if (!username || !roomId || !message) {
        return socket.emit('error', { message: 'Username, room ID, and message are required' })
      }

      const chatRoom = await ChatRoomModel.findById({ _id: roomId, isDeleted: false })
      if (!chatRoom) {
        return socket.emit('error', { message: 'Chat room not found' })
      }

      const user = await UserModel.findOne({ username, isDeleted: false })
      if (!user) {
        return socket.emit('error', { message: 'User not found' })
      }

      if (!chatRoom.members.includes(username) && chatRoom.host !== username) {
        return socket.emit('error', { message: 'User is not a member of this chat room' })
      }

      const chatMessage = new ChatMessageModel({
        user: username,
        content: message,
        room: roomId
      })
      await chatMessage.save()

      socket.to(data.roomId).emit('newMessage', { username, message }) // this will broadcast the message to all users in the room except the sender
      socket.emit('newMessage', { username, message }) // this will send the message to the sender
    })

    socket.on('joinRoom', async (data) => {
      const { username, rooms } = data

      const user = await UserModel.findOne({ username, isDeleted: false })
      if (!user) {
        return socket.emit('error', { message: 'User not found' })
      }

      const validRooms = await ChatRoomModel.find({
        _id: { $in: rooms },
        members: { $in: [username] },
        isDeleted: false
      })

      for (const room of validRooms) {
        socket.join(room._id)
        console.log('Joined room: ', room._id)
        socket.to(room._id).emit('onlineUser', { username, room: room._id })
        socket.emit('onlineUser', { username, room: room._id })
      }
    })

    socket.on('leaveRoom', (room) => {
      socket.leave(room)
      console.log('Left room: ', room)
    })
  })
}

const emitSocketEvent = (req, roomId, event, data) => {
  req.app.get('io').to(roomId).emit(event, data)
}

module.exports = {
  connectSocket,
  emitSocketEvent
}
