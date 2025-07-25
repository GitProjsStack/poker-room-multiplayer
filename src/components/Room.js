import React, { useContext, useEffect, useState, useRef } from 'react';
import { SocketContext } from '../context/SocketContext';
import PokerGameInProgress from './PokerGameInProgress';
import GameShowdown from './GameShowdown';

const hostDisconnectedMessage = '⚠️ Host disconnected. Please exit the game.';
const raiseOptions = [1, 5, 10, 20, 50, 100];

function Room({ players, roomCode, isHost }) {
  const socket = useContext(SocketContext);

  const [gameStarted, setGameStarted] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [betSize, setBetSize] = useState(2);
  const [communityCards, setCommunityCards] = useState([]);

  const [currentTurnPlayerId, setCurrentTurnPlayerId] = useState('');
  const [currentTurnPlayerName, setCurrentTurnPlayerName] = useState('');
  const [isYourTurn, setIsYourTurn] = useState(false);
  const [hand, setHand] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [isFolded, setIsFolded] = useState(false);
  const [pot, setPot] = useState(0);
  const [isNextRound, setIsNextRound] = useState(false);
  const [message, setMessage] = useState('');

  const [countdown, setCountdown] = useState(null);
  const countdownRef = useRef(null);

  const currentPlayer = players.find(p => p.id === socket.id);
  const chipBalance = currentPlayer?.chipBalance ?? 0;
  const toCall = Math.max(0, betSize);

  const [showdownData, setShowdownData] = useState(null);

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

    socket.on('update_community_cards', (cards) => {
      setCommunityCards(cards);
    });

    socket.on('deal_hand', (cards) => {
      setHand(cards);
      setShowdownData(null);
      setIsNextRound(false);
      setIsFolded(false);
      setMessage('');
      setCountdown(null);
    });

    socket.on('update_pot', (newPot) => {
      setPot(newPot);
    });

    socket.on('round_winner', ({ winnerName, amount }) => {
      setMessage(`All other players folded. ${winnerName} wins ${amount} chips!`);
      setIsNextRound(true);

      let count = 5;
      setCountdown(count);
      countdownRef.current = setInterval(() => {
        count -= 1;
        if (count <= 0) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
        setCountdown(count > 0 ? count : null);
      }, 1000);
    });

    socket.on('host_disconnected', () => {
      clearCountdown(); // Stop any existing countdowns

      setGameStarted(false);
      setHand([]);
      setMessage(hostDisconnectedMessage);
      setIsFolded(true);
      setIsNextRound(false);
      setCurrentTurnPlayerId('');
      setCurrentTurnPlayerName('');
      setIsYourTurn(false);
      setCountdown(null);
    });

    socket.on('game_ended', () => {
      setGameStarted(false);
      setMessage('Game ended.');
      setCountdown(null);
      setHand([]);
    });

    socket.on('showdown', (data) => {
      setShowdownData(data);
      setMessage('Showdown! Here are the cards.');
      setIsYourTurn(false);
    });


    function clearCountdown() {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    }

    return () => {
      socket.off('game_started');
      socket.off('new_loop');
      socket.off('your_turn');
      socket.off('current_turn');
      socket.off('update_bet_size');
      socket.off('update_community_cards');
      socket.off('deal_hand');
      socket.off('update_pot');
      socket.off('round_winner');
      socket.off('host_disconnected');
      socket.off('game_ended');
      clearCountdown();
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

  return (
    <div className="room">
      <h2>Hello {currentPlayer?.name}. You are in room '{roomCode}'</h2>

      {message === hostDisconnectedMessage ? (
        <div style={{ textAlign: 'center', marginTop: '80px' }}>
          <h1 style={{ fontSize: '48px', color: 'red' }}>Host Disconnected</h1>
          <p style={{ fontSize: '24px', color: 'gray' }}>
            The game has ended. Please return to the lobby or refresh to join a new game.
          </p>
        </div>
      ) : countdown !== null ? (
        <div style={{ textAlign: 'center', marginTop: '80px' }}>
          <h1 style={{ fontSize: '60px', color: 'limegreen' }}>Next round in...</h1>
          <h2 style={{ fontSize: '120px', color: 'orange' }}>{countdown}</h2>
        </div>
      ) : showdownData ? (
        <GameShowdown showdownData={showdownData} players={players} />
      ) : gameStarted ? (
        <PokerGameInProgress
          isYourTurn={isYourTurn}
          currentTurnPlayerName={currentTurnPlayerName}
          communityCards={communityCards}
          hand={hand}
          chipBalance={chipBalance}
          betSize={betSize}
          toCall={toCall}
          pot={pot}
          loopNum={loopNum}
          message={message}
          errorMsg={errorMsg}
          fold={fold}
          call={call}
          raise={raise}
          isFolded={isFolded}
          isNextRound={isNextRound}
        />
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

          {isHost && (
            <button className="btn start-btn" onClick={startGame}>
              Start Game
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default Room;
