import evaluateHand from 'poker-hand-evaluator';

export function evaluateWinners(players, communityCards) {
  const hands = players.map(player => {
    const fullHand = [...(player.hand || []), ...communityCards].map(card => ({
      value: card.code[0],
      suit: card.code[1].toUpperCase()
    }));
    
    return {
      playerId: player.id,
      name: player.name,
      handEval: evaluateHand(fullHand),
    };
  });

  const bestRank = Math.min(...hands.map(h => h.handEval.rank));
  const winners = hands.filter(h => h.handEval.rank === bestRank);

  return hands.map(h => ({
    ...h,
    isWinner: winners.some(w => w.playerId === h.playerId)
  }));
}
