import React, { useMemo } from 'react';
import { evaluateWinners } from '../helpers/evaluatePokerHand';

function GameShowdown({ showdownData, players }) {
    const evaluatedPlayers = useMemo(() => {
        if (!showdownData) return [];
        const enrichedPlayers = players.map(p => ({
            ...p,
            hand: showdownData.hands[p.id] || []
        }));
        return evaluateWinners(enrichedPlayers, showdownData.communityCards);
    }, [players, showdownData]);

    if (!showdownData) return null;

    return (
        <div className="showdown-container">
            <h1>-----------------------------------------------------------------------------------</h1>
            <h2>🔥 Showdown Time!</h2>

            <div className="community-cards-on-table">
                {showdownData.communityCards.map(card => (
                    <img
                        key={card.code}
                        src={card.image}
                        alt={card.code}
                        className="community-card-img"
                    />
                ))}
            </div>

            <div className="players-hands">
                {evaluatedPlayers.map(player => (
                    <div
                        key={player.playerId}
                        className={`player-hand-showdown ${player.isWinner ? 'winner' : ''}`}
                    >
                        <p>
                            {player.name}'s Hand
                            {player.isWinner && ' 🏆 Winner!'}
                        </p>
                        <div>
                            {player.hand.cards.map(card => (
                                <img
                                    key={card.code}
                                    src={card.image}
                                    alt={card.code}
                                    className="player-hand-card"
                                />
                            ))}
                        </div>
                        <p style={{ fontSize: '14px', color: '#ccc' }}>
                            Combination: {player.hand.name}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default GameShowdown;
