const rooms = {};

function createRoom(roomCode, hostId, hostName) {
  rooms[roomCode] = {
    hostId,
    players: [
      { id: hostId, name: hostName, chips: 1000, isHost: true }
    ]
  };
}

function joinRoom(roomCode, playerId, playerName) {
  const room = rooms[roomCode];

  if (!room) return { error: "Room not found." };
  if (room.players.length >= 6) return { error: "Room is full." };

  room.players.push({ id: playerId, name: playerName, chips: 1000, isHost: false });
  return { success: true };
}

function getRoomPlayers(roomCode) {
  return rooms[roomCode]?.players || [];
}

function roomExists(roomCode) {
  return !!rooms[roomCode];
}

function removePlayer(socketId) {
  for (const code in rooms) {
    const room = rooms[code];
    room.players = room.players.filter(p => p.id !== socketId);

    if (room.players.length === 0) {
      delete rooms[code]; // cleanup empty room
    }
  }
}

module.exports = {
  createRoom,
  joinRoom,
  roomExists,
  getRoomPlayers,
  removePlayer
};
