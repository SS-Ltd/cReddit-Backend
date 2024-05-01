const connectSocket = (io) => {
  console.log('Connecting to the server: ', io)
  return io.on('connection', (socket) => {
    socket.join(socket.roomId)
    console.log('Connected to the server')

    socket.on('disconnect', () => {
      console.log('Disconnected from the server')
    })

    socket.on('chatMessage', (msg) => {
      console.log('Message: ', msg)
    })

    socket.on('joinRoom', (data) => {
      const { username, room } = data
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
