import React, { useContext, useEffect, useState } from 'react';
import { SocketContext } from '../context/SocketContext';

function Room({ players, roomCode, isHost }) {
  const socket = useContext(SocketContext);
  const [gameStarted, setGameStarted] = useState(false);
  const [betSize, setBetSize] = useState(2);
  const [playerBet, setPlayerBet] = useState(0);
  const [hand, setHand] = useState([]);

  const currentPlayer = players.find((p) => p.id === socket.id);
  const chipBalance = currentPlayer?.chipBalance ?? 0;

  useEffect(() => {
    socket.on('game_started', () => {
      setGameStarted(true);
      setPlayerBet(0);
    });

    socket.on('update_bet_size', (newBetSize) => {
      setBetSize(newBetSize);
    });

    socket.on('update_player_bet', (bet) => {
      setPlayerBet(bet);
    });

    socket.on('deal_hand', (cards) => {
      setHand(cards);
    });

    return () => {
      socket.off('game_started');
      socket.off('update_bet_size');
      socket.off('update_player_bet');
      socket.off('deal_hand');
    };
  }, [socket]);

  const startGame = () => {
    socket.emit('start_game', roomCode);
  };

  const raise = () => {
    if (chipBalance <= 0) return;
    const raiseAmount = betSize + 10;
    socket.emit('raise_bet', roomCode, raiseAmount);
  };

  const call = () => {
    if (chipBalance < betSize - playerBet) return;
    socket.emit('call_bet', roomCode, betSize);
  };

  const fold = () => {
    socket.emit('fold', roomCode);
  };

  return (
    <div className="room">
      <h2>Hello {currentPlayer?.name}. You are in room '{roomCode}'</h2>

      {!gameStarted && isHost && (
        <button className="btn start-btn" onClick={startGame}>
          Start Game
        </button>
      )}

      {gameStarted ? (
        <div className="game-container">
          <div className="poker-table">
            <img src="/poker-table.png" alt="Poker Table" className="table-image" />
          </div>

          <div className="player-info">
            <div className="hand">
              {hand.map((card) => (
                <img key={card.code} src={card.image} alt={card.code} />
              ))}
            </div>

            <p>Your Chip Balance: {chipBalance}</p>
            <p>Current Bet Size to Call: {betSize}</p>
            <p>Your Current Bet: {playerBet}</p>

            <div className="player-actions">
              <button className="btn" onClick={raise} disabled={chipBalance <= 0}>
                Raise
              </button>
              <button className="btn" onClick={call} disabled={chipBalance < betSize - playerBet}>
                Call
              </button>
              <button className="btn" onClick={fold}>
                Fold
              </button>
            </div>
          </div>
        </div>
      ) : (
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
      )}
    </div>
  );
}

export default Room;
