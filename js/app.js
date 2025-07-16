class ChampionsApp {
  constructor() {
    this.allChampions = [];
    this.championSkinsCount = {};
    window.app = this; // Hacer accesible globalmente
    this.init();
  }

  async init() {
    // Validar que todos los elementos DOM existan
    if (!UI.validateElements()) {
      console.error('Algunos elementos DOM no fueron encontrados. Reintentando en 100ms...');
      setTimeout(() => this.init(), 100);
      return;
    }
    
    this.setupEventListeners();
    Favorites.updateFavoritesCount();
    await this.loadChampions();
  }

  setupEventListeners() {
    console.log('Configurando event listeners...');
    
    if (UI.elements.modeToggle) {
      UI.elements.modeToggle.onclick = () => UI.toggleMode();
      console.log('Mode toggle configurado');
    }
    if (UI.elements.searchInput) {
      UI.elements.searchInput.addEventListener('input', (e) => this.filterChampions(e.target.value));
      console.log('Search input configurado');
    }
    
    // Event listener para cambio de pestañas (sin Bootstrap)
    const favoritesTab = document.getElementById('favorites-tab');
    if (favoritesTab) {
      favoritesTab.addEventListener('click', (e) => {
        console.log('Click en favorites tab');
        e.preventDefault();
        this.switchToFavoritesTab();
      });
      console.log('Favorites tab configurado');
    }

    const allTab = document.getElementById('all-tab');
    if (allTab) {
      allTab.addEventListener('click', (e) => {
        console.log('Click en all tab');
        e.preventDefault();
        this.switchToAllTab();
      });
      console.log('All tab configurado');
    }

    // Event listeners para pestañas del modal
    const infoTab = document.getElementById('info-tab');
    const runesTab = document.getElementById('runes-tab');
    
    if (infoTab) {
      infoTab.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchModalTab('championDetails', infoTab);
      });
    }
    
    if (runesTab) {
      runesTab.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchModalTab('championRunes', runesTab);
      });
    }
  }

  switchToFavoritesTab() {
    console.log('Cambiando a favoritos');
    // Cambiar pestañas activas
    const allTab = document.getElementById('all-tab');
    const favTab = document.getElementById('favorites-tab');
    
    if (allTab) allTab.classList.remove('active', 'bg-gray-700');
    if (favTab) favTab.classList.add('active', 'bg-gray-700');
    
    // Cambiar contenido visible
    const allChampions = document.getElementById('all-champions');
    const favoriteChampions = document.getElementById('favorite-champions');
    
    if (allChampions) {
      allChampions.classList.remove('show', 'active');
      allChampions.classList.add('fade');
      allChampions.style.display = 'none';
    }
    
    if (favoriteChampions) {
      favoriteChampions.classList.remove('fade');
      favoriteChampions.classList.add('show', 'active');
      favoriteChampions.style.display = 'block';
    }
    
    // Renderizar favoritos
    UI.renderFavorites();
  }

  switchToAllTab() {
    console.log('Cambiando a todos');
    // Cambiar pestañas activas
    const allTab = document.getElementById('all-tab');
    const favTab = document.getElementById('favorites-tab');
    
    if (favTab) favTab.classList.remove('active', 'bg-gray-700');
    if (allTab) allTab.classList.add('active', 'bg-gray-700');
    
    // Cambiar contenido visible
    const allChampions = document.getElementById('all-champions');
    const favoriteChampions = document.getElementById('favorite-champions');
    
    if (favoriteChampions) {
      favoriteChampions.classList.remove('show', 'active');
      favoriteChampions.classList.add('fade');
      favoriteChampions.style.display = 'none';
    }
    
    if (allChampions) {
      allChampions.classList.remove('fade');
      allChampions.classList.add('show', 'active');
      allChampions.style.display = 'block';
    }
  }

  switchModalTab(targetId, clickedTab) {
    // Remover active de todas las pestañas del modal
    document.querySelectorAll('#championDetailsTabNav button').forEach(tab => {
      tab.classList.remove('active', 'bg-gray-700');
    });
    
    // Activar la pestaña clickeada
    clickedTab.classList.add('active', 'bg-gray-700');
    
    // Ocultar todos los contenidos
    document.querySelectorAll('#championDetailsTabContent .tab-pane').forEach(pane => {
      pane.classList.remove('show', 'active');
      pane.classList.add('fade');
      pane.style.display = 'none';
    });
    
    // Mostrar el contenido target
    const targetPane = document.getElementById(targetId);
    if (targetPane) {
      targetPane.classList.remove('fade');
      targetPane.classList.add('show', 'active');
      targetPane.style.display = 'block';
    }
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
