import React, { useState } from 'react';
import { SocketContext, socket } from './context/SocketContext';
import Lobby from './components/Lobby';
import Room from './components/Room';
import './styles.css';

function App() {
  const [players, setPlayers] = useState([]);
  const [inRoom, setInRoom] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [isHost, setIsHost] = useState(false);

  return (
    <SocketContext.Provider value={socket}>
      <div className="App">
        <h1>Poker Room Multiplayer 🃏</h1>
        {!inRoom ? (
          <Lobby
            setPlayers={setPlayers}
            setRoomCode={setRoomCode}
            setIsHost={setIsHost}
            setInRoom={setInRoom}
          />
        ) : (
          <Room players={players} roomCode={roomCode} isHost={isHost} />
        )}
      </div>
    </SocketContext.Provider>
  );
}

export default App;
