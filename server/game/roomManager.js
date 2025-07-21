const rooms = {};

function createRoom(roomCode, hostId, hostName) {
  rooms[roomCode] = {
    players: [{ id: hostId, name: hostName, isHost: true }],
    gameStarted: false
  };
}

function joinRoom(roomCode, playerId, playerName) {
  const room = rooms[roomCode];
  if (!room) return { error: 'Room does not exist' };
  if (room.gameStarted) return { error: 'Game already started in this room' };

  const alreadyInRoom = room.players.some(p => p.id === playerId);
  if (!alreadyInRoom) {
    room.players.push({ id: playerId, name: playerName, isHost: false });
  }

  return {};
}

function startGame(roomCode) {
  if (rooms[roomCode]) {
    rooms[roomCode].gameStarted = true;
    return true;
  }
  return false;
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

    if (room.players.length === 0) {
      delete rooms[roomCode];
    }
  }
}

module.exports = {
  createRoom,
  joinRoom,
  startGame,
  getRoomPlayers,
  roomExists,
  removePlayer,
};
