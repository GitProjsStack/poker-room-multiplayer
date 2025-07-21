import React from 'react';
import { SocketContext, socket } from './context/SocketContext';
import Lobby from './components/Lobby';
import './styles.css';

function App() {
  return (
    <SocketContext.Provider value={socket}>
      <div className="App">
        <h1>Poker Room Multiplayer 🃏</h1>
        <Lobby />
      </div>
    </SocketContext.Provider>
  );
}

export default App;
