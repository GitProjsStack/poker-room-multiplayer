const {
  createRoom,
  joinRoom,
  startGame,
  getPlayerHand,
  getRoomPlayers,
  roomExists,
  getRoom,
  removePlayer,
  haveAllActed,
  advanceLoop,
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

      room.lastAggressorIndex = room.players.findIndex(p => p.id === socket.id);
    }

    player.hasActed = true;

    if (everyoneMatched(room)) {
      advanceLoop(room, io, roomCode);
    } else {
      advanceTurn(roomCode);
    }
  });

  socket.on('raise_bet', (roomCode, newBetSize) => {
    const room = getRoom(roomCode);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player || player.folded) return;

    const toCall = room.betSize - player.bet;
    const raiseAmount = newBetSize - room.betSize;
    const totalCost = toCall + raiseAmount;

    if (newBetSize <= room.betSize || player.chipBalance < totalCost) return;

    player.chipBalance -= totalCost;
    player.bet += totalCost;
    room.pot += totalCost;
    room.betSize = newBetSize;

    room.lastAggressorIndex = room.players.findIndex(p => p.id === socket.id);

    io.to(roomCode).emit('update_bet_size', room.betSize);
    io.to(roomCode).emit('update_pot', room.pot);

    resetHasActed(room);
    player.hasActed = true;

    advanceTurn(roomCode);
  });

  socket.on('fold', async (roomCode) => {
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

      // Start new round after short delay
      setTimeout(async () => {
        const res = await startGame(roomCode);
        if (res) {
          const players = getRoomPlayers(roomCode);
          for (const p of players) {
            const hand = getPlayerHand(roomCode, p.id);
            io.to(p.id).emit('deal_hand', hand);
          }

          const room = getRoom(roomCode);
          room.loopNum += 1;
          io.to(roomCode).emit('new_loop', room.loopNum);
          io.to(roomCode).emit('game_started');
          io.to(roomCode).emit('room_update', room.players);
          io.to(roomCode).emit('update_pot', room.pot);
          sendTurnInfo(roomCode);
          console.log(`🔄 New round started in room ${roomCode}`);
        }
      }, 3000); // Delay for clarity/UI feedback
      return;
    }

    advanceTurn(roomCode);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Disconnected: ${socket.id}`);
    removePlayer(socket.id, io);
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

    const everyoneCalledOrChecked = room.players
      .filter(p => !p.folded && p.chipBalance > 0)
      .every(p => p.bet === room.betSize);

    const isBackToAggressor = nextIndex === room.lastAggressorIndex;

    if (everyoneCalledOrChecked && isBackToAggressor) {
      advanceLoop(room, io, roomCode);
    } else {
      sendTurnInfo(roomCode);
    }
  }

  function everyoneMatched(room) {
    const activePlayers = room.players.filter(p => !p.folded);
    return activePlayers.every(p => p.bet === room.betSize || p.chipBalance === 0 || p.folded || p.hasActed);
  }

  function resetHasActed(room) {
    room.players.forEach(p => p.hasActed = false);
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
