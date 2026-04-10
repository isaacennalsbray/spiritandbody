/**
 * TurnQueue — determines actor order each turn based on speed.
 * Ties: player actors go before enemy actors (slight human advantage).
 * Stunned / dead actors are skipped.
 */

export default class TurnQueue {
  /**
   * @param {object[]} actors  Each: { id, name, speed, isAlive, isStunned, side: 'player'|'enemy' }
   */
  build(actors) {
    return [...actors]
      .filter(a => a.isAlive && !a.isStunned)
      .sort((a, b) => {
        if (b.speed !== a.speed) return b.speed - a.speed;
        // Tie: player goes first
        if (a.side === 'player' && b.side === 'enemy') return -1;
        if (a.side === 'enemy' && b.side === 'player') return  1;
        return 0;
      })
      .map(a => a.id);
  }
}
