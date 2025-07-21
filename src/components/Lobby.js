import React, { useContext, useState, useEffect } from 'react';
import { SocketContext } from '../context/SocketContext';

function Lobby() {
  const socket = useContext(SocketContext);
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const [players, setPlayers] = useState([]);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const joinRoom = () => {
    if (name && room) {
      socket.emit('join_room', room, name);
      setStatus(`Attempting to join room ${room}...`);
      setError('');
    }
  };

  useEffect(() => {
    socket.on('room_update', (playerList) => {
      setPlayers(playerList);
      const currentPlayer = playerList.find((p) => p.id === socket.id);
      const isHost = currentPlayer?.isHost;

      setStatus(
        isHost
          ? `✅ Room ${room} created. You're the host.`
          : `✅ Joined room ${room}.`
      );
      setError('');
    });

    socket.on('join_error', (errMsg) => {
      setError(errMsg);
      setStatus('');
    });

    return () => {
      socket.off('room_update');
      socket.off('join_error');
    };
  }, [socket, room]);

  return (
    <div className="lobby">
      <h2>Join or Create a Poker Room</h2>
      <p style={{ fontSize: '14px', color: '#aaa' }}>
        Enter a room code to join. If the room doesn't exist, one will be created.
      </p>

      <input
        type="text"
        placeholder="Your Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="text"
        placeholder="Room Code (e.g., ABC123)"
        value={room}
        onChange={(e) => setRoom(e.target.value.toUpperCase())}
      />
      <button onClick={joinRoom}>Join or Create Room</button>

      {/* Status or error messages */}
      {status && <p style={{ color: 'lightgreen', marginTop: '10px' }}>{status}</p>}
      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}

      {/* Player List */}
      {players.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Players in Room:</h3>
          <ul>
            {players.map((p) => (
              <li key={p.id}>
                {p.name} {p.isHost && '(Host)'}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default Lobby;
