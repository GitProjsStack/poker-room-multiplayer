import { useContext, useEffect, useState } from 'react';
import { SocketContext } from '../context/SocketContext';
import PokerGameInProgress from './PokerGameInProgress';
import GameShowdown from './GameShowdown';

function Room({ players: initialPlayers, roomCode, isHost }) {
  const socket = useContext(SocketContext);

  const [players, setPlayers] = useState(initialPlayers);
  const [gameStarted, setGameStarted] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [betSize, setBetSize] = useState(2);
  const [communityCards, setCommunityCards] = useState([]);

  const [currentTurnId, setCurrentTurnId] = useState('');
  const [hand, setHand] = useState([]);
  const [error, setError] = useState('');
  const [pot, setPot] = useState(0);
  const [showdownData, setShowdownData] = useState(null);
  const [message, setMessage] = useState('');

  const currentPlayer = players.find(p => p.id === socket.id);
  const folded = currentPlayer?.folded || false;
  const isYourTurn = currentTurnId === socket.id;

  const chipBalance = currentPlayer?.chipBalance || 0;
  const toCall = Math.max(2, betSize - (currentPlayer?.bet || 0));

  useEffect(() => {

    socket.on('game_started', () => {
      setGameStarted(true);
      setMessage('');
    });

    socket.on('new_loop', (newLoopNum) => {
      setLoopNum(newLoopNum);
      setError('');
      setMessage('');
    });

    socket.on('current_turn', ({ playerId }) => {
      setCurrentTurnId(playerId);
    });
    socket.on('update_bet_size', setBetSize);
    socket.on('update_pot', setPot);
    socket.on('update_community_cards', setCommunityCards);

    socket.on('deal_hand', (cards) => {
      setHand(cards);
      setError('');
      setMessage('');
      setShowdownData(null);
    });

    socket.on('round_winner', ({ winnerName, amount, reason }) => {
      const msg = reason
        ? `${reason} ${winnerName} wins ${amount} chips.`
        : `${winnerName} wins ${amount} chips.`;
      setMessage(msg);
    });

    socket.on('force_fold', (roomCode) => {
      socket.emit('fold', roomCode);
    });

    socket.on('player_folded', ({ name }) => {
      setMessage(`${name} folded.`);
    });

    socket.on('room_update', (updatedPlayers) => {
      setPlayers(updatedPlayers);
    });

    socket.on('showdown', (data) => {
      setShowdownData(data);
      setMessage('Showdown! Revealing hands...');
    });

    socket.on('host_disconnected', () => {
      setGameStarted(false);
      setMessage('⚠️ Host disconnected. Game ended.');
    });

    socket.on('game_ended', () => {
      setGameStarted(false);
      setMessage('Game ended.');
    });

    socket.on('action_error', (msg) => {
      setError(msg);
    });

    return () => {
      socket.off('game_started');
      socket.off('new_loop');
      socket.off('your_turn');
      socket.off('current_turn');
      socket.off('update_bet_size');
      socket.off('update_pot');
      socket.off('update_community_cards');
      socket.off('deal_hand');
      socket.off('round_winner');
      socket.off('force_fold');
      socket.off('player_folded');
      socket.off('room_update');
      socket.off('showdown');
      socket.off('host_disconnected');
      socket.off('game_ended');
      socket.off('action_error');
    };
  }, [socket]);

  const startGame = () => socket.emit('start_game', roomCode);

  const fold = () => {
    setError('');
    socket.emit('fold', roomCode);
  };

  const call = () => {
    if (toCall < 2) {
      setError('You must call at least 2 chips. No checking allowed.');
      return;
    }
    if (chipBalance < toCall) {
      setError(`You need ${toCall} chips to call but only have ${chipBalance}.`);
      return;
    }
    socket.emit('call_bet', roomCode);
    setError('');
  };

  const raise = (amount) => {
    const total = toCall + amount;
    if (chipBalance < total) {
      setError(`You need ${total} chips to raise by ${amount}.`);
      return;
    }
    socket.emit('raise_bet', roomCode, betSize + amount);
    setError('');
  };

  return (
    <div className="room">
      <h2>Hello {currentPlayer?.name}, you're in room '{roomCode}'</h2>

      {showdownData ? (
        <GameShowdown 
        showdownData={showdownData} 
        players={players}
        roomCode={roomCode}
        />
      ) : gameStarted ? (
        <PokerGameInProgress
          isYourTurn={isYourTurn}
          currentTurnPlayerName={players.find(p => p.id === currentTurnId)?.name || ''}
          communityCards={communityCards}
          hand={hand}
          chipBalance={chipBalance}
          betSize={betSize}
          toCall={toCall}
          pot={pot}
          loopNum={loopNum}
          message={message}
          errorMsg={error}
          fold={fold}
          call={call}
          raise={raise}
          isNextTurn={folded || !isYourTurn}
        />
      ) : (
        <div>
          <h4>Players in the room:</h4>
          <ul>
            {players.map(p => (
              <li key={p.id}>{p.name} {p.isHost && '(Host)'}</li>
            ))}
          </ul>
          {isHost && (
            <button className="btn start-btn" onClick={startGame}>
              Start Game
            </button>
          )}
          {message && <p>{message}</p>}
        </div>
      )}
    </div>
  );
}

export default Room;
