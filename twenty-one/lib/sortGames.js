// Compare object titles alphabetically (case insensitive)
const compareByDate = (itemA, itemB) => {
  return itemB.timeLastPlayed - itemA.timeLastPlayed;
};

const sortGames = (games) => {
  let inPlay = games.filter(game => !game.player.isBroke());
  let broke = games.filter(game => game.player.isBroke());
  inPlay.sort(compareByDate);
  broke.sort(compareByDate);
  return [].concat(inPlay, broke);
};

module.exports = sortGames;
