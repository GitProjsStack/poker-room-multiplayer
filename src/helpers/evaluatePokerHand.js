import PokerHand from 'poker-hand-evaluator';

export default function evaluateWinners(players) {
  const results = players.map(player => {
    // Here, player.hand is a **space-separated string** of cards like "AD 3C AS 8C 8H 7H 4S"
    const evalObj = new PokerHand(player.hand);

    return {
      playerId: player.id,
      name: player.name,
      rankScore: evalObj.getScore(),
      rankName: evalObj.getRank(),
      handName: evalObj.handName,
    };
  });

  const bestScore = Math.min(...results.map(r => r.rankScore));
  const winners = results.filter(r => r.rankScore === bestScore);

  return results.map(r => ({
    ...r,
    isWinner: winners.some(w => w.playerId === r.playerId),
  }));
}
