import React, { useContext, useEffect, useState } from 'react';
import { SocketContext } from '../context/SocketContext';

function Room({ players, roomCode, isHost }) {
  const socket = useContext(SocketContext);

  const [gameStarted, setGameStarted] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [betSize, setBetSize] = useState(2);
  const [currentTurnPlayerId, setCurrentTurnPlayerId] = useState('');
  const [currentTurnPlayerName, setCurrentTurnPlayerName] = useState('');
  const [isYourTurn, setIsYourTurn] = useState(false);
  const [hand, setHand] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [isFolded, setIsFolded] = useState(false);
  const [pot, setPot] = useState(0);
  const [isNextRound, setIsNextRound] = useState(false);
  const [message, setMessage] = useState('');

  const currentPlayer = players.find(p => p.id === socket.id);
  const chipBalance = currentPlayer?.chipBalance ?? 0;
  const toCall = Math.max(0, betSize);

  useEffect(() => {
    socket.on('game_started', () => {
      setGameStarted(true);
      setIsFolded(false);
      setErrorMsg('');
      setMessage('');
    });

    socket.on('new_loop', (loop) => {
      setLoopNum(loop);
    });

    socket.on('your_turn', () => {
      setIsYourTurn(true);
    });

    socket.on('current_turn', ({ playerId, playerName }) => {
      setCurrentTurnPlayerId(playerId);
      setCurrentTurnPlayerName(playerName);
      setIsYourTurn(playerId === socket.id);
    });

    socket.on('update_bet_size', (newBetSize) => {
      setBetSize(newBetSize);
    });

    socket.on('deal_hand', (cards) => {
      setHand(cards);
    });

    socket.on('update_pot', (newPot) => {
      setPot(newPot);
    });

    socket.on('round_winner', ({ winnerName, amount }) => {
      setMessage(`All other players folded. ${winnerName} wins ${amount} chips!`);
      setIsNextRound(true);
    });

    return () => {
      socket.off('game_started');
      socket.off('new_loop');
      socket.off('your_turn');
      socket.off('current_turn');
      socket.off('update_bet_size');
      socket.off('deal_hand');
      socket.off('update_pot');
      socket.off('round_winner');
    };
  }, [socket]);

  const startGame = () => {
    socket.emit('start_game', roomCode);
  };

  const fold = () => {
    socket.emit('fold', roomCode);
    setIsFolded(true);
    setErrorMsg('');
  };

  const call = () => {
    if (chipBalance < toCall) {
      setErrorMsg(`You need ${toCall} chips to call, but only have ${chipBalance}.`);
      return;
    }
    socket.emit('call_bet', roomCode);
    setErrorMsg('');
  };

  const raise = (amount) => {
    const totalCost = toCall + amount;
    if (chipBalance < totalCost) {
      setErrorMsg(`You need ${totalCost} chips to raise by ${amount}, but only have ${chipBalance}.`);
      return;
    }
    socket.emit('raise_bet', roomCode, betSize + amount);
    setErrorMsg('');
  };

  const raiseOptions = [1, 5, 10, 20, 50, 100];

  return (
    <div className="room">
      <h2>Hello {currentPlayer?.name}. You are in room '{roomCode}'</h2>

      <p style={{ fontWeight: 'bold', color: 'orange' }}>
        {gameStarted && (isYourTurn
          ? "🎯 It's your turn!"
          : currentTurnPlayerName
            ? `🕒 Waiting for ${currentTurnPlayerName}...`
            : '')}
      </p>

      {!gameStarted && isHost && (
        <button className="btn start-btn" onClick={startGame}>
          Start Game
        </button>
      )}

      {gameStarted ? (
        <>
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

              Your Chip Balance: {chipBalance}<br />
              Current Bet Size to Call: {betSize}<br />
              Amount To Call: {toCall}<br />
              Total Pot: {pot}<br />
              Current Betting Round: {loopNum}<br />

              {message && <p style={{ color: 'limegreen' }}>{message}</p>}
              {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}
            </div>
          </div>

          <div className="player-actions">
            <div>
              <button
                className="btn btn-red"
                onClick={fold}
                disabled={isFolded || isNextRound || !isYourTurn}
              >
                Fold
              </button>

              <button
                className="btn btn-green"
                onClick={call}
                disabled={chipBalance < toCall || isFolded || isNextRound || !isYourTurn}
              >
                {toCall === 0 ? 'Check' : `Call ${toCall}`}
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
              {raiseOptions.map((amt) => {
                const totalCost = toCall + amt;
                return (
                  <button
                    key={amt}
                    className="btn btn-blue"
                    onClick={() => raise(amt)}
                    disabled={chipBalance < totalCost || isFolded || isNextRound || !isYourTurn}
                  >
                    Raise by {amt}
                  </button>
                );
              })}
            </div>
          </div>
        </>
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
