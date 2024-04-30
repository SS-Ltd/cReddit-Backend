const connectSocket = (io) => {
  console.log('Connecting to the server: ', io)
  return io.on('connection', (socket) => {
    socket.join('room')
    console.log('Connected to the server')

    socket.on('disconnect', () => {
      console.log('Disconnected from the server')
    })

    socket.on('chatMessage', (msg) => {
      console.log('Message: ', msg)
    })

    socket.on('joinRoom', (room) => {
      socket.join(room)
      console.log('Joined room: ', room)
    })

    socket.on('leaveRoom', (room) => {
      socket.leave(room)
      console.log('Left room: ', room)
    })
  })
}

module.exports = {
  connectSocket
}
