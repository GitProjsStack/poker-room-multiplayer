import { useState } from 'react';

function Lobby({ onJoinRoom }) {
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');

  const handleJoin = () => {
    if (!name.trim() || !room.trim()) {
      alert('Please enter your name and room code');
      return;
    }
    onJoinRoom(room.toUpperCase(), name.trim());
  };

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
      <button onClick={handleJoin}>Join or Create Room</button>
    </div>
  );
}

export default Lobby;
