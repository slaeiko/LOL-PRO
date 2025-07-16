class ChampionsApp {
  constructor() {
    this.allChampions = [];
    this.championSkinsCount = {};
    window.app = this; // Hacer accesible globalmente
    this.init();
  }

  async init() {
    this.setupEventListeners();
    Favorites.updateFavoritesCount();
    await this.loadChampions();
  }

  setupEventListeners() {
    UI.elements.modeToggle.onclick = () => UI.toggleMode();
    UI.elements.searchInput.addEventListener('input', (e) => this.filterChampions(e.target.value));
    
    // Event listener para cambio de pestañas
    document.getElementById('favorites-tab').addEventListener('shown.bs.tab', () => {
      UI.renderFavorites();
    });

    // Actualiza runas/builds al cambiar de campeón en el modal
    document.getElementById('championDetailsTabNav').addEventListener('shown.bs.tab', (e) => {
      // No es necesario recargar, la info ya está en el DOM
    });
  }

  async loadChampions() {
    this.allChampions = await API.getChampions();
    
    // Obtener número de skins por campeón
    const skinPromises = this.allChampions.map(async (champ) => {
      const championData = await API.getChampionDetails(champ.id);
      if (championData) {
        this.championSkinsCount[champ.id] = championData.skins.length;
      }
    });

    await Promise.all(skinPromises);
    UI.renderChampions(this.allChampions, this.championSkinsCount);
  }

  filterChampions(searchValue) {
    const value = searchValue.toLowerCase();
    const filtered = this.allChampions.filter(champ => 
      champ.name.toLowerCase().includes(value)
    );
    UI.renderChampions(filtered, this.championSkinsCount);
  }
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
  new ChampionsApp();
});
