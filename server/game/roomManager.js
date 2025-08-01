const axios = require('axios');

const rooms = {};

async function createRoom(roomCode, hostId, hostName) {
  rooms[roomCode] = {
    players: [{
      id: hostId,
      name: hostName,
      isHost: true,
      chipBalance: 1000,
      folded: false,
      bet: 0,
      hasActed: false,
    }],
    gameStarted: false,
    deckId: null,
    hands: {},
    dealerIndex: 0,
    pot: 0,
    betSize: 2, // Enforce mandatory 2-chip minimum call
    currentTurnIndex: 0,
    waitingForInitialCalls: true,
    loopNum: 0,
    actedPlayerIds: new Set(),
    communityCards: [],
    lastAggressorIndex: null,
  };
}

function joinRoom(roomCode, playerId, playerName) {
  const room = rooms[roomCode];
  if (!room) return { error: 'Room does not exist' };
  if (room.gameStarted) return { error: 'Game already started in this room' };

  const alreadyInRoom = room.players.some(p => p.id === playerId);
  if (!alreadyInRoom) {
    room.players.push({
      id: playerId,
      name: playerName,
      isHost: false,
      chipBalance: 1000,
      folded: false,
      bet: 0,
      hasActed: false,
    });
  }

  return {};
}

async function startGame(roomCode) {
  const room = rooms[roomCode];
  if (!room) return false;

  try {
    const res = await axios.get('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1');
    const deckId = res.data.deck_id;
    room.deckId = deckId;

    const count = room.players.length * 2;
    const drawRes = await axios.get(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=${count}`);
    const cards = drawRes.data.cards;

    room.hands = {};
    room.players.forEach((player, index) => {
      room.hands[player.id] = [cards[index * 2], cards[index * 2 + 1]];
      player.bet = 0;
      player.folded = false;
      player.hasActed = false;
    });

    room.gameStarted = true;
    room.waitingForInitialCalls = true;
    room.currentTurnIndex = 0;
    room.pot = 0;
    room.betSize = 2; // Enforce minimum call
    room.lastAggressorIndex = 0;
    room.loopNum = 0;
    room.actedPlayerIds = new Set();
    room.communityCards = [];

    return true;
  } catch (err) {
    console.error('Failed to start game:', err.message);
    return false;
  }
}

function getPlayerHand(roomCode, playerId) {
  return rooms[roomCode]?.hands?.[playerId] || [];
}

function getRoomPlayers(roomCode) {
  return rooms[roomCode]?.players || [];
}

function roomExists(roomCode) {
  return Boolean(rooms[roomCode]);
}

function getRoom(roomCode) {
  return rooms[roomCode];
}

function removePlayer(socketId, io) {
  for (const roomCode in rooms) {
    const room = rooms[roomCode];
    const wasHost = room.players.find(p => p.id === socketId && p.isHost);
    const wasInRoom = room.players.some(p => p.id === socketId);
    if (!wasInRoom) continue;

    room.players = room.players.filter(p => p.id !== socketId);
    delete room.hands?.[socketId];

    io.to(roomCode).emit('room_update', room.players);

    if (wasHost) {
      io.to(roomCode).emit('host_disconnected');
      setTimeout(() => {
        io.to(roomCode).emit('game_ended');
        delete rooms[roomCode];
        console.log(`🛑 Room ${roomCode} closed due to host leaving`);
      }, 5000);
    }

    if (room.players.length === 0) {
      delete rooms[roomCode];
      console.log(`🗑️ Room ${roomCode} deleted (all players left)`);
    }

    break;
  }
}

function getActivePlayers(room) {
  return room.players.filter(p => !p.folded);
}

function haveAllActed(room) {
  const activeIds = getActivePlayers(room).map(p => p.id);
  return activeIds.every(id => room.actedPlayerIds.has(id));
}

async function advanceLoop(room, io, roomCode) {
  room.loopNum += 1;
  room.actedPlayerIds = new Set();

  room.players.forEach(p => {
    p.bet = 0;
    p.hasActed = false;
  });

  // Keep betSize fixed at 2 for all loops (no free check rounds)
  room.betSize = 2;
  room.lastAggressorIndex = room.currentTurnIndex;

  await revealCommunityCards(room);

  io.to(roomCode).emit('new_loop', room.loopNum);
  io.to(roomCode).emit('update_bet_size', room.betSize);
  io.to(roomCode).emit('update_community_cards', room.communityCards);

  if (room.loopNum >= 4) {
    io.to(roomCode).emit('showdown', {
      communityCards: room.communityCards,
      hands: room.hands,
      players: room.players,
    });
  }
}

function handlePlayerDisconnect(socketId) {
  for (const roomCode in rooms) {
    const room = rooms[roomCode];
    room.players = room.players.filter(p => p.id !== socketId);
    delete room.hands?.[socketId];

    if (room.players.length === 0) {
      delete rooms[roomCode];
      console.log(`🫥 All players disconnected from room ${roomCode}. Game ended.`);
    }
  }
}

async function revealCommunityCards(room) {
  const { loopNum, deckId } = room;

  if (loopNum === 1) {
    const flop = await drawCards(deckId, 3);
    room.communityCards.push(...flop);
  } else if (loopNum === 2 || loopNum === 3) {
    const single = await drawCards(deckId, 1);
    if (single.length) room.communityCards.push(single[0]);
  }
}

async function drawCards(deckId, count) {
  try {
    const res = await axios.get(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=${count}`);
    return res.data.cards;
  } catch (err) {
    console.error(`Failed to draw ${count} cards:`, err.message);
    return [];
  }
}

module.exports = {
  createRoom,
  joinRoom,
  startGame,
  getPlayerHand,
  getRoomPlayers,
  roomExists,
  getRoom,
  removePlayer,
  getActivePlayers,
  haveAllActed,
  advanceLoop,
  handlePlayerDisconnect,
};
