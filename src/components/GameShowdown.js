import { useMemo, useEffect, useContext } from 'react';
import evaluateWinners from '../helpers/evaluatePokerHand';
import { SocketContext } from '../context/SocketContext';

function convertCardCode(code) {
    let rank = code.slice(0, code.length - 1);
    const suit = code.slice(-1).toLowerCase();

    if (rank === '10' || rank === '0') rank = 'T';

    return rank.toUpperCase() + suit;
}

export default function GameShowdown({ showdownData, players, roomCode }) {
    const socket = useContext(SocketContext);

    const evaluated = useMemo(() => {
        if (!showdownData) return [];

        const playersToPassIn = players.map(p => {
            const combinedCards = [
                ...(showdownData.hands[p.id] || []),
                ...showdownData.communityCards
            ].map(c => convertCardCode(c.code));

            return {
                id: p.id,
                name: p.name,
                cards: combinedCards
            };
        });

        return evaluateWinners(playersToPassIn);
    }, [showdownData, players]);

    useEffect(() => {
        if (showdownData && evaluated.length > 0) {
            const winner = evaluated.find(p => p.isWinner);

            const timer = setTimeout(() => {
                if (winner) {
                    socket.emit('force_fold_others', roomCode, winner.playerId);
                }
            }, 2000); // 2 seconds after showdown

            return () => clearTimeout(timer);
        }
    }, [showdownData, evaluated, socket, roomCode]);

    if (!showdownData) return null;

    return (
        <div className="showdown-container">
            <h2>🔥 Showdown!</h2>

            {/* COMMUNITY CARDS ROW */}
            <div className="community-cards-row">
                {showdownData.communityCards.map(c => (
                    <img
                        key={c.code}
                        src={c.image}
                        alt={c.code}
                        className="community-card-img"
                    />
                ))}
            </div>

            {/* PLAYERS CARDS ROW */}
            <div className="players-cards-row">
                {evaluated.map(p => (
                    <div
                        key={p.playerId}
                        className={`player-hand ${p.isWinner ? 'winner' : ''}`}
                    >
                        <div>
                            <p>{p.name} got a {p.handName}.</p>
                            {p.isWinner && (
                                <p style={{ marginTop: 0, color: 'lime', fontWeight: 'bold' }}>
                                    🏆WINNER🏆
                                </p>
                            )}
                        </div>
                        <div className="player-cards">
                            {(showdownData.hands[p.playerId] || []).map(c => (
                                <img
                                    key={c.code}
                                    src={c.image}
                                    alt={c.code}
                                    className="player-hand-card"
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
