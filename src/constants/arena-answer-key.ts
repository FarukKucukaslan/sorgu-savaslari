export const ANSWER_BY_SIGNATURE: Record<string, string> = {
  'min-goblin-hp': 'SELECT name, hp FROM goblins ORDER BY hp ASC LIMIT 1',
  'goblin-count-by-dungeon': 'SELECT dungeon, COUNT(*) AS goblin_count FROM goblins GROUP BY dungeon',
  'high-hp-goblins': 'SELECT name, hp FROM goblins WHERE hp > 20 ORDER BY hp DESC',
};
