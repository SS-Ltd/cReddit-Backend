
const connectSocket = (io) => {
    console.log('Connecting to the server: ', io)
    return io.on('connection', (socket) => {
        socket.join('room')
        console.log('Connected to the server')

        socket.on('disconnect', () => {
            console.log('Disconnected from the server')
        })
    })
}

const emitSocketEvent = (req, roomId, event, payload) => {
    req.app.get("io").in(roomId).emit(event, payload);
  };

module.exports = {
    connectSocket,
    emitSocketEvent
}