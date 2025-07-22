const {
  createRoom,
  joinRoom,
  startGame,
  getPlayerHand,
  roomExists,
  getRoomPlayers,
  removePlayer
} = require('../game/roomManager');

module.exports = (io, socket) => {
  socket.on('join_room', (roomCode, playerName) => {
    if (!roomExists(roomCode)) {
      createRoom(roomCode, socket.id, playerName);
      console.log(`🆕 Room created: ${roomCode} by ${playerName}`);
    } else {
      const result = joinRoom(roomCode, socket.id, playerName);
      if (result.error) {
        socket.emit('join_error', result.error);
        return;
      }
    }

    socket.join(roomCode);
    const players = getRoomPlayers(roomCode);
    console.log(`Room update for ${roomCode}:`, players);
    io.to(roomCode).emit('room_update', players);
    console.log(`👤 ${playerName} joined room ${roomCode}`);
  });

  socket.on('start_game', async (roomCode) => {
    const success = await startGame(roomCode);
    if (success) {
      const players = getRoomPlayers(roomCode);
      for (const player of players) {
        const hand = getPlayerHand(roomCode, player.id);
        io.to(player.id).emit('deal_hand', hand);
      }

      io.to(roomCode).emit('game_started');
      console.log(`🎮 Game started in room ${roomCode}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ ${socket.id} disconnected`);
    removePlayer(socket.id);
  });
};
