import React from 'react';

function GameShowdown({ showdownData, players }) {
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
                {players.map(player => (
                    <div key={player.id} className="player-hand-showdown">
                        <p>{player.name}'s Hand:</p>
                        <div>
                            {(showdownData.hands[player.id] || []).map(card => (
                                <img
                                    key={card.code}
                                    src={card.image}
                                    alt={card.code}
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

export default GameShowdown;
