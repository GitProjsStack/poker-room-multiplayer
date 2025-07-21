import React, { useContext, useEffect, useState } from 'react';
import { SocketContext } from '../context/SocketContext';

function Room({ players, roomCode, isHost }) {
  const socket = useContext(SocketContext);
  const [gameStarted, setGameStarted] = useState(false);

  const startGame = () => {
    socket.emit('start_game', roomCode);
  };

  useEffect(() => {
    socket.on('game_started', () => {
      setGameStarted(true);
    });

    return () => {
      socket.off('game_started');
    };
  }, [socket]);

  const currentPlayer = players.find((p) => p.id === socket.id);

  return (
    <div className="room">
      <h2>Room: {roomCode}</h2>
      <h3>{isHost ? 'You are the host 🧑‍✈️' : 'Waiting for host...'}</h3>

      {!gameStarted && isHost && (
        <button onClick={startGame} style={{ marginTop: '12px' }}>
          Start Game
        </button>
      )}

      {!gameStarted ? (
        <div>
          <h4>Players:</h4>
          <ul>
            {players.map((p) => (
              <li key={p.id}>
                {p.name} {p.isHost && '(Host)'}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="poker-table">
          <div className="chips">
            <span style={{ color: 'blue' }}>🟦 x10</span>
            <span style={{ color: 'white' }}>⚪ x20</span>
            <span style={{ color: 'green' }}>🟩 x5</span>
            <span style={{ color: 'red' }}>🟥 x15</span>
          </div>

          <div className="player-cards">
            <h4>{currentPlayer?.name}</h4>
            <div className="hand">
              <img src="/card-back.png" alt="Card 1" />
              <img src="/card-back.png" alt="Card 2" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Room;
