import { Hand } from 'pokersolver';

export default function evaluateWinners(players) {
  const handsWithEval = players.map(player => {
    const hand = Hand.solve(player.cards); // array of strings like ['Ad', 'Ks', ...]
    
    return {
      playerId: player.id,
      name: player.name,
      rankName: hand.name,
      handName: hand.descr,
      solvedHand: hand
    };
  });

  const winningHands = Hand.winners(handsWithEval.map(p => p.solvedHand));

  return handsWithEval.map(p => ({
    ...p,
    isWinner: winningHands.includes(p.solvedHand)
  }));
}
