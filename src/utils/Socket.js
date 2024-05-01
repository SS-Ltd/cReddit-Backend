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

      socket.to(data.roomId).emit('newMessage', { username, message })
      const chatMessage = new ChatMessageModel({
        user: username,
        content: message,
        room: roomId
      })
      await chatMessage.save()
    })

    socket.on('joinRoom', async (data) => {
      const { username, room } = data

      const user = await UserModel.findOne({ username, isDeleted: false })
      if (!user) {
        return socket.emit('error', { message: 'User not found' })
      }

      const chatRoom = await ChatRoomModel.findById({ _id: room, isDeleted: false })
      if (!chatRoom) {
        return socket.emit('error', { message: 'Chat room not found' })
      }

      if (!chatRoom.members.includes(username)) {
        return socket.emit('error', { message: 'User is not a member of this chat room' })
      }

      socket.join(room)
      console.log('Joined room: ', room)
      socket.to(room).emit('newUser', { username, room })
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
