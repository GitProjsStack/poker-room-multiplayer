const {
  createRoom,
  joinRoom,
  startGame,
  getPlayerHand,
  getRoomPlayers,
  roomExists,
  getRoom,
  haveAllActed,
  advanceLoop,
  handlePlayerDisconnect,
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

      const room = getRoom(roomCode);
      io.to(roomCode).emit('game_started');
      io.to(roomCode).emit('room_update', room.players);
      io.to(roomCode).emit('update_pot', room.pot);
      sendTurnInfo(roomCode);
      console.log(`🎮 Game started in room ${roomCode}`);
    }
  });

  socket.on('call_bet', (roomCode) => {
    const room = getRoom(roomCode);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player || player.folded) return;

    const toCall = room.betSize - player.bet;
    if (toCall > 0 && player.chipBalance >= toCall) {
      player.chipBalance -= toCall;
      player.bet += toCall;
      room.pot += toCall;

      io.to(roomCode).emit('update_pot', room.pot);
    }

    updateLoopAndTurn(roomCode, player);
  });

  socket.on('raise_bet', (roomCode, newBetSize) => {
    const room = getRoom(roomCode);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player || player.folded) return;

    if (newBetSize % 5 !== 0 || newBetSize <= room.betSize) return;

    const toCall = room.betSize - player.bet;
    const raiseAmount = newBetSize - room.betSize;
    const totalCost = toCall + raiseAmount;

    if (player.chipBalance >= totalCost) {
      player.chipBalance -= totalCost;
      player.bet += totalCost;
      room.betSize = newBetSize;
      room.pot += totalCost;

      io.to(roomCode).emit('update_bet_size', newBetSize);
      io.to(roomCode).emit('update_pot', room.pot);
    }

    updateLoopAndTurn(roomCode, player);
  });

  socket.on('fold', (roomCode) => {
    const room = getRoom(roomCode);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    player.folded = true;

    const remainingPlayers = room.players.filter(p => !p.folded);
    if (remainingPlayers.length === 1) {
      const winner = remainingPlayers[0];
      winner.chipBalance += room.pot;

      io.to(roomCode).emit('round_winner', {
        winnerName: winner.name,
        amount: room.pot,
      });

      room.pot = 0;
      io.to(roomCode).emit('update_pot', 0);
      io.to(roomCode).emit('room_update', room.players);
      return;
    }

    advanceTurn(roomCode);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Disconnected: ${socket.id}`);
    handlePlayerDisconnect(socket.id);
  });

  function advanceTurn(roomCode) {
    const room = getRoom(roomCode);
    if (!room) return;

    let nextIndex = room.currentTurnIndex;
    let attempts = 0;

    do {
      nextIndex = (nextIndex + 1) % room.players.length;
      attempts++;
    } while (room.players[nextIndex].folded && attempts < room.players.length);

    room.currentTurnIndex = nextIndex;
    io.to(roomCode).emit('room_update', room.players);

    sendTurnInfo(roomCode);
  }

  function sendTurnInfo(roomCode) {
    const room = getRoom(roomCode);
    if (!room) return;

    const currentPlayer = room.players[room.currentTurnIndex];

    io.to(roomCode).emit('current_turn', {
      playerId: currentPlayer.id,
      playerName: currentPlayer.name,
    });

    io.to(currentPlayer.id).emit('your_turn');
  }

  function updateLoopAndTurn(roomCode, player) {
    const room = getRoom(roomCode);
    if (!room || player.folded) return;

    room.actedPlayerIds.add(player.id);

    if (haveAllActed(room)) {
      advanceLoop(room, io, roomCode);
    }

    advanceTurn(roomCode);
  }

};
