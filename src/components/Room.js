import React from 'react';

function Room({ players, roomCode, isHost }) {
  return (
    <div className="room">
      <h2>Room: {roomCode}</h2>
      <h3>{isHost ? 'You are the host 🧑‍✈️' : 'Waiting for host...'}</h3>
      <ul>
        {players.map((p) => (
          <li key={p.id}>
            {p.name} {p.isHost && '(Host)'}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Room;
