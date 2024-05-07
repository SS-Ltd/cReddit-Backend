const ChatMessageModel = require('../models/ChatMessage')
const ChatRoomModel = require('../models/ChatRoom')
const UserModel = require('../models/User')

const connectSocket = (io) => {
  console.log('Connecting to the server: ', io)
  return io.on('connection', async (socket) => {
    console.log(socket.decoded, ' connected to the server')
    socket.on('disconnect', () => {
      console.log(socket.decoded, ' disconnected from the server')
    })

    const username = socket.decoded.username
    const rooms = await ChatRoomModel.find({ members: { $in: [username] } })

    for (const room of rooms) {
      socket.join(room._id.toString())
    }

    socket.on('chatMessage', async (data) => { // data = { roomId, message }
      console.log('Message: ', data)
      const { roomId, message } = data

      if (!roomId || !message) {
        return socket.emit('error', { message: 'room ID and message are required' })
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

      if (chatRoom.members.length === 2) {
        const membersArray = chatRoom.members
        const users = await UserModel.find({
          username: { $in: membersArray },
          blockedUsers: { $not: { $elemMatch: { $in: membersArray } } },
          isDeleted: false
        })
        if (users.length !== 2) {
          return socket.emit('error', { message: 'some members have blocked each other' })
        }
      }

      const chatMessage = new ChatMessageModel({
        user: username,
        content: message,
        room: roomId
      })
      await chatMessage.save()
      const profilePicture = user.profilePicture

      socket.to(roomId).emit('newMessage', { username, message, roomId, profilePicture })
      socket.emit('newMessage', { username, message, roomId, profilePicture })
    })

    socket.on('leaveRoom', (room) => {
      console.log('Left room: ', room)
      socket.leave(room)
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
