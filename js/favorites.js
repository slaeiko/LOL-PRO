const Favorites = {
  STORAGE_KEY: 'lol-favorites',

  getFavorites() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  addFavorite(championId) {
    const favorites = this.getFavorites();
    if (!favorites.includes(championId)) {
      favorites.push(championId);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(favorites));
      this.updateFavoritesCount();
      return true;
    }
    return false;
  },

  removeFavorite(championId) {
    const favorites = this.getFavorites();
    const index = favorites.indexOf(championId);
    if (index > -1) {
      favorites.splice(index, 1);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(favorites));
      this.updateFavoritesCount();
      return true;
    }
    return false;
  },

  isFavorite(championId) {
    return this.getFavorites().includes(championId);
  },

  toggleFavorite(championId) {
    if (this.isFavorite(championId)) {
      this.removeFavorite(championId);
      return false;
    } else {
      this.addFavorite(championId);
      return true;
    }
  },

  updateFavoritesCount() {
    const count = this.getFavorites().length;
    const badge = document.getElementById('favoritesCount');
    if (badge) {
      badge.textContent = count;
    }
  },

  getFavoriteChampions(allChampions) {
    const favorites = this.getFavorites();
    return allChampions.filter(champ => favorites.includes(champ.id));
  }
};
