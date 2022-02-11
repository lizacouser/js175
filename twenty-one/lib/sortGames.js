// Compare object titles alphabetically (case insensitive)
const compareByTitle = (itemA, itemB) => {
  let titleA = itemA.title.toLowerCase();
  let titleB = itemB.title.toLowerCase();

  if (titleA < titleB) {
    return -1;
  } else if (titleA > titleB) {
    return 1;
  } else {
    return 0;
  }
};

const sortGames = (games) => {
  let inPlay = games.filter(game => !game.player.isBroke());
  let broke = games.filter(game => game.player.isBroke());
  inPlay.sort(compareByTitle);
  broke.sort(compareByTitle);
  return [].concat(inPlay, broke);
}

module.exports = sortGames;
