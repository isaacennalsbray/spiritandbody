export const TYPE_BEATS = {
  water: 'fire',
  fire: 'plant',
  plant: 'lightning',
  lightning: 'glow',
  glow: 'ice',
  ice: 'rock',
  rock: 'water',
};

export function getTypeMultiplier(moveType, defenderType) {
  if (!moveType || !defenderType) return 1.0;
  if (TYPE_BEATS[moveType] === defenderType) return 1.5;
  if (TYPE_BEATS[defenderType] === moveType) return 0.75;
  return 1.0;
}
