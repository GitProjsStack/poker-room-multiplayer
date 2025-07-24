const axios = require('axios');

const rooms = {};

async function createRoom(roomCode, hostId, hostName) {
  rooms[roomCode] = {
    players: [{ id: hostId, name: hostName, isHost: true, chipBalance: 1000, folded: false, bet: 0 }],
    gameStarted: false,
    deckId: null,
    hands: {},
    dealerIndex: 0,
    pot: 0,
    betSize: 0,
    currentTurnIndex: 0,
    waitingForInitialCalls: true,
  };
}

function joinRoom(roomCode, playerId, playerName) {
  const room = rooms[roomCode];
  if (!room) return { error: 'Room does not exist' };
  if (room.gameStarted) return { error: 'Game already started in this room' };

  const alreadyInRoom = room.players.some(p => p.id === playerId);
  if (!alreadyInRoom) {
    room.players.push({ id: playerId, name: playerName, isHost: false, chipBalance: 1000, folded: false, bet: 0 });
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
    });

    room.gameStarted = true;
    room.waitingForInitialCalls = true;
    room.currentTurnIndex = 0;
    room.pot = 0;
    room.betSize = 2; // initial buy-in
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

function removePlayer(socketId) {
  for (const roomCode in rooms) {
    const room = rooms[roomCode];
    room.players = room.players.filter((p) => p.id !== socketId);
    delete room.hands?.[socketId];

    if (room.players.length === 0) {
      delete rooms[roomCode];
    }
  }
}

function getRoom(roomCode) {
  return rooms[roomCode];
}

module.exports = {
  createRoom,
  joinRoom,
  startGame,
  getPlayerHand,
  getRoomPlayers,
  roomExists,
  removePlayer,
  getRoom,
};