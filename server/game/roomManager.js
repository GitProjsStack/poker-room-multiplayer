const axios = require('axios');

const rooms = {};

async function createRoom(roomCode, hostId, hostName) {
  rooms[roomCode] = {
    players: [{ id: hostId, name: hostName, isHost: true, chipBalance: 1000 }],
    gameStarted: false,
    deckId: null,
    hands: {},
  };
}

function joinRoom(roomCode, playerId, playerName) {
  const room = rooms[roomCode];
  if (!room) return { error: 'Room does not exist' };
  if (room.gameStarted) return { error: 'Game already started in this room' };

  const alreadyInRoom = room.players.some(p => p.id === playerId);
  if (!alreadyInRoom) {
    room.players.push({ id: playerId, name: playerName, isHost: false, chipBalance: 1000 });
  }

  return {};
}

async function startGame(roomCode) {
  const room = rooms[roomCode];
  if (!room) return false;

  try {
    // Get a new deck
    const res = await axios.get('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1');
    const deckId = res.data.deck_id;
    room.deckId = deckId;

    // Deal 2 cards to each player
    const count = room.players.length * 2;
    const drawRes = await axios.get(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=${count}`);
    const cards = drawRes.data.cards;

    room.hands = {};
    room.players.forEach((player, index) => {
      room.hands[player.id] = [cards[index * 2], cards[index * 2 + 1]];
    });

    room.gameStarted = true;
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

module.exports = {
  createRoom,
  joinRoom,
  startGame,
  getPlayerHand,
  getRoomPlayers,
  roomExists,
  removePlayer,
};
