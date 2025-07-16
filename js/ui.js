const UI = {
  elements: {
    championsContainer: document.getElementById("champions"),
    favoriteChampionsContainer: document.getElementById("favoriteChampions"),
    modal: document.getElementById('skinsModal'),
    modalTitle: document.getElementById('skinsModalLabel'),
    carouselInner: document.getElementById('carouselInner'),
    searchInput: document.getElementById('searchInput'),
    modeToggle: document.getElementById('modeToggle'),
    skinsLoader: document.getElementById('skinsLoader'),
    championInfoLoader: document.getElementById('championInfoLoader'),
    championDetails: document.getElementById('championDetails'),
    championLore: document.getElementById('championLore'),
    championTags: document.getElementById('championTags'),
    championStats: document.getElementById('championStats'),
    championSpells: document.getElementById('championSpells')
  },

  renderChampions(champions, championSkinsCount, container = null) {
    const targetContainer = container || this.elements.championsContainer;
    targetContainer.innerHTML = '';

    if (champions.length === 0 && container === this.elements.favoriteChampionsContainer) {
      targetContainer.innerHTML = '<div class="col-span-2 md:col-span-4 text-center text-gray-400"><p>No tienes campeones favoritos aún.</p></div>';
      return;
    }

    champions.forEach(champ => {
      const card = document.createElement('div');
      card.className = '';
      const isFavorite = Favorites.isFavorite(champ.id);

      card.innerHTML = `
        <div class="relative rounded-lg shadow-lg bg-gray-800 text-white hover:scale-105 transition-transform champion-card" data-champ="${champ.id}">
          <button class="absolute top-2 right-2 z-10 px-2 py-1 rounded-full bg-yellow-400 text-black favorite-btn ${isFavorite ? 'font-bold' : ''}" 
                  onclick="event.stopPropagation(); UI.toggleFavorite('${champ.id}', this)">
            ${isFavorite ? '★' : '☆'}
          </button>
          <img src="${API.getChampionImageUrl(champ.image.full)}" class="w-full h-40 object-cover rounded-t-lg" alt="${champ.name}">
          <div class="p-4">
            <h5 class="text-lg font-bold">${champ.name}</h5>
            <p class="text-sm text-gray-300">${champ.title}</p>
            <span class="inline-block mt-2 px-2 py-1 rounded bg-blue-600 text-white text-xs">Skins: ${championSkinsCount[champ.id] || '-'}</span>
          </div>
        </div>
      `;
      card.querySelector('.champion-card').onclick = () => this.showSkins(champ.id, champ.name);
      targetContainer.appendChild(card);
    });
  },

  toggleFavorite(championId, button) {
    const isFavorite = Favorites.toggleFavorite(championId);
    button.classList.toggle('font-bold', isFavorite);
    button.innerHTML = isFavorite ? '★' : '☆';
    
    // Actualizar la pestaña de favoritos si está activa
    const favoritesTab = document.getElementById('favorites-tab');
    if (favoritesTab.classList.contains('active')) {
      this.renderFavorites();
    }
  },

  renderFavorites() {
    if (window.app && window.app.allChampions) {
      const favoriteChampions = Favorites.getFavoriteChampions(window.app.allChampions);
      this.renderChampions(favoriteChampions, window.app.championSkinsCount, this.elements.favoriteChampionsContainer);
    }
  },

  setupTabs() {
    const nav = document.getElementById('championDetailsTabNav');
    const panes = document.querySelectorAll('#championDetailsTabContent .tab-pane');
    nav.querySelectorAll('button').forEach((btn, idx) => {
      btn.onclick = () => {
        // Quitar estilos activos de todos los botones
        nav.querySelectorAll('button').forEach(b => b.classList.remove('active', 'bg-gray-700'));
        btn.classList.add('active', 'bg-gray-700');
        // Mostrar solo el panel correspondiente
        panes.forEach((pane, i) => {
          if (i === idx) {
            pane.classList.remove('hidden');
            pane.classList.add('block');
          } else {
            pane.classList.add('hidden');
            pane.classList.remove('block');
          }
        });
      };
    });
    // Inicializa: solo muestra la primera tab
    panes.forEach((pane, i) => {
      if (i === 0) {
        pane.classList.remove('hidden');
        pane.classList.add('block');
      } else {
        pane.classList.add('hidden');
        pane.classList.remove('block');
      }
    });
  },

  async showSkins(champId, champName) {
    // Mostrar modal
    this.elements.modal.classList.remove('hidden');
    this.elements.modal.classList.add('flex');

    this.elements.skinsLoader.classList.remove('hidden');
    this.elements.championInfoLoader.classList.remove('hidden');
    this.elements.championDetails.classList.add('hidden');
    this.elements.carouselInner.innerHTML = '';
    this.elements.modalTitle.textContent = champName;

    const championData = await API.getChampionDetails(champId);
    if (championData) {
      this.loadChampionInfo(championData);
      await this.loadSkins(champId, champName, championData.skins);
      this.loadRunesAndBuilds(champId);
    }

    // Carrusel: inicializa navegación
    this.initCarousel();
    this.setupTabs();
  },

  async loadSkins(champId, champName, skins) {
    await API.preloadSkinImages(champId, skins);

    this.elements.carouselInner.innerHTML = '';
    skins.forEach((skin, idx) => {
      this.elements.carouselInner.innerHTML += `
        <div class="carousel-item${idx === 0 ? ' active' : ''}" style="${idx !== 0 ? 'display:none;' : ''}">
          <img src="${API.getSkinSplashUrl(champId, skin.num)}" class="block w-full" alt="${skin.name}">
          <div class="absolute bottom-6 left-1/2 transform -translate-x-1/2 px-6 py-2 rounded-lg bg-black bg-opacity-60 shadow-lg text-center">
            <span class="text-2xl font-bold text-blue-300 drop-shadow-lg">${skin.name === 'default' ? champName : skin.name}</span>
          </div>
        </div>
      `;
    });

    this.elements.skinsLoader.classList.add('hidden');
  },

  initCarousel() {
    const items = Array.from(document.querySelectorAll('.carousel-item'));
    let current = items.findIndex(item => item.classList.contains('active'));
    if (current === -1) current = 0;
    showItem(current);

    function showItem(idx) {
      items.forEach((item, i) => {
        item.style.display = i === idx ? 'block' : 'none';
        item.classList.toggle('active', i === idx);
      });
    }

    document.getElementById('carouselPrevBtn').onclick = () => {
      current = (current - 1 + items.length) % items.length;
      showItem(current);
    };
    document.getElementById('carouselNextBtn').onclick = () => {
      current = (current + 1) % items.length;
      showItem(current);
    };
  },

  // Cerrar modal
  closeModal() {
    this.elements.modal.classList.add('hidden');
    this.elements.modal.classList.remove('flex');
  },

  async loadRunesAndBuilds(champId) {
    const runesContent = document.getElementById('championRunesContent');
    runesContent.innerHTML = `
      <div class="text-center"><div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div></div>
    `;
    try {
      const response = await fetch('lol_runes_top.csv');
      const text = await response.text();
      const lines = text.split('\n');
      let found = false;
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(col => col.trim());
        if (!cols[0]) continue;
        if (cols[0].toLowerCase() === champId.toLowerCase()) {
          // Filtra URLs únicas
          const urls = Array.from(new Set(cols.slice(1).filter(url => url.startsWith('http'))));
          
          // Categorizar runas correctamente
          const statRunes = urls.filter(url => url.includes('StatMod'));
          const treeRunes = urls.filter(url => !url.includes('StatMod'));
          
          // Identificar árbol principal vs secundario por la estructura de la URL
          const primaryTreeRunes = [];
          const secondaryTreeRunes = [];
          
          // Detectar el árbol principal (el que tiene más runas)
          const treeTypes = {};
          treeRunes.forEach(url => {
            const match = url.match(/\/Styles\/([^\/]+)\//);
            if (match) {
              const treeType = match[1];
              if (!treeTypes[treeType]) treeTypes[treeType] = [];
              treeTypes[treeType].push(url);
            }
          });
          
          // El árbol con más runas es el principal
          const sortedTrees = Object.entries(treeTypes).sort((a, b) => b[1].length - a[1].length);
          
          if (sortedTrees.length > 0) {
            primaryTreeRunes.push(...sortedTrees[0][1]);
          }
          if (sortedTrees.length > 1) {
            secondaryTreeRunes.push(...sortedTrees[1][1]);
          }

          runesContent.innerHTML = `
            <div class="space-y-4">
              <!-- Título Principal -->
              <div class="text-center">
                <h3 class="text-xl font-bold text-blue-400 mb-2">Runas Recomendadas</h3>
                <div class="w-12 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
              </div>

              <!-- Runas Primarias -->
              ${primaryTreeRunes.length > 0 ? `
                <div class="bg-gray-800 rounded-lg p-3 border border-blue-600">
                  <div class="flex items-center justify-center mb-3">
                    <div class="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center mr-2">
                      <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    </div>
                    <h4 class="text-sm font-semibold text-blue-300">Árbol Principal</h4>
                  </div>
                  <div class="grid grid-cols-2 gap-2 justify-center">
                    ${primaryTreeRunes.map(url => `
                      <div class="rune-primary-container rounded-lg p-2 flex items-center justify-center">
                        <img src="${url}" class="w-16 h-16 rounded shadow-lg rune-image object-contain" loading="lazy">
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}

              <!-- Runas Secundarias -->
              ${secondaryTreeRunes.length > 0 ? `
                <div class="bg-gray-800 rounded-lg p-3 border border-green-600">
                  <div class="flex items-center justify-center mb-3">
                    <div class="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center mr-2">
                      <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                      </svg>
                    </div>
                    <h4 class="text-sm font-semibold text-green-300">Árbol Secundario</h4>
                  </div>
                  <div class="grid grid-cols-2 gap-2 justify-center">
                    ${secondaryTreeRunes.map(url => `
                      <div class="bg-gradient-to-br from-gray-800 to-gray-700 rounded-lg p-2 flex items-center justify-center border border-green-600 shadow hover:transform hover:translateY-1 transition-all">
                        <img src="${url}" class="w-16 h-16 rounded shadow-lg rune-image object-contain" loading="lazy">
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}

              <!-- Runas de Estadísticas -->
              ${statRunes.length > 0 ? `
                <div class="bg-gray-800 rounded-lg p-3 border border-yellow-600">
                  <div class="flex items-center justify-center mb-3">
                    <div class="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center mr-2">
                      <svg class="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"/>
                        <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"/>
                      </svg>
                    </div>
                    <h4 class="text-sm font-semibold text-yellow-300">Estadísticas</h4>
                  </div>
                  <div class="flex justify-center gap-2 flex-wrap">
                    ${statRunes.map(url => `
                      <div class="rune-stat-container rounded-lg p-2 flex items-center justify-center">
                        <img src="${url}" class="w-12 h-12 rounded shadow-lg rune-image object-contain" loading="lazy">
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}

              <!-- Consejos -->
              <div class="bg-gradient-to-r from-blue-900 to-purple-900 rounded-lg p-3 border border-blue-700">
                <div class="flex items-center mb-2">
                  <svg class="w-4 h-4 text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                  </svg>
                  <h4 class="text-xs font-semibold text-blue-300">Consejo</h4>
                </div>
                <p class="text-xs text-blue-200">Principal: 4 runas del árbol principal | Secundario: 2 runas de otro árbol | Estadísticas: 3 bonificaciones</p>
              </div>
            </div>
          `;
          found = true;
          break;
        }
      }
      if (!found) {
        runesContent.innerHTML = `
          <div class="text-center py-6">
            <div class="w-12 h-12 bg-gray-700 rounded-full mx-auto mb-3 flex items-center justify-center">
              <svg class="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
              </svg>
            </div>
            <h3 class="text-sm font-semibold text-gray-400 mb-1">No hay runas disponibles</h3>
            <p class="text-xs text-gray-500">No se encontraron runas para este campeón.</p>
          </div>
        `;
      }
    } catch (e) {
      runesContent.innerHTML = `
        <div class="text-center py-6">
          <div class="w-12 h-12 bg-red-900 rounded-full mx-auto mb-3 flex items-center justify-center">
            <svg class="w-6 h-6 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
          </div>
          <h3 class="text-sm font-semibold text-red-400 mb-1">Error al cargar runas</h3>
          <p class="text-xs text-red-300">Hubo un problema al cargar las runas.</p>
        </div>
      `;
    }
  },

  loadChampionInfo(championData) {
    // Lore
    const lore = championData.lore;
    const loreElem = this.elements.championLore;
    loreElem.textContent = '';
    const prevBtn = document.getElementById('loreReadMoreBtn');
    if (prevBtn) prevBtn.remove();
    if (lore.length > 500) {
      const shortText = document.createTextNode(lore.substring(0, 500) + '...');
      const btn = document.createElement('button');
      btn.id = 'loreReadMoreBtn';
      btn.className = 'text-blue-400 underline ml-2 text-xs';
      btn.textContent = 'Leer más';
      btn.onclick = function() {
        loreElem.textContent = lore;
      };
      loreElem.appendChild(shortText);
      loreElem.appendChild(btn);
    } else {
      loreElem.textContent = lore;
    }

    // Tags/Roles
    this.elements.championTags.innerHTML = championData.tags.map(tag =>
      `<span class="px-2 py-1 rounded bg-blue-700 text-white text-xs">${tag}</span>`
    ).join('');

    // Stats con barras visuales
    const stats = championData.stats;
    const statList = [
      { label: 'Ataque', value: stats.attackdamage, max: 120, color: 'bg-red-500' },
      { label: 'Defensa', value: stats.armor, max: 80, color: 'bg-green-500' },
      { label: 'Magia', value: stats.spellblock, max: 80, color: 'bg-blue-500' },
      { label: 'Velocidad de ataque', value: stats.attackspeed, max: 1, color: 'bg-yellow-500' }
    ];
    this.elements.championStats.innerHTML = statList.map(stat => `
      <div class="mb-2">
        <div class="flex justify-between text-xs mb-1">
          <span>${stat.label}</span>
          <span>${stat.value}</span>
        </div>
        <div class="w-full h-3 bg-gray-700 rounded">
          <div class="${stat.color} h-3 rounded transition-all" style="width:${Math.min(100, (stat.value/stat.max)*100)}%"></div>
        </div>
      </div>
    `).join('');

    // Habilidades
    this.elements.championSpells.innerHTML = '';
    if (championData.passive) {
      this.elements.championSpells.innerHTML += `
        <div class="flex items-center mb-2 p-2 rounded bg-gray-800">
          <img src="${API.getPassiveImageUrl(championData.passive.image.full)}" class="w-10 h-10 rounded mr-2" alt="Pasiva">
          <div>
            <strong>Pasiva: ${championData.passive.name}</strong>
            <p class="text-xs text-gray-300 mb-0">${championData.passive.description.replace(/<[^>]*>/g, '').substring(0, 100)}...</p>
          </div>
        </div>
      `;
    }
    championData.spells.forEach((spell, idx) => {
      const keys = ['Q', 'W', 'E', 'R'];
      this.elements.championSpells.innerHTML += `
        <div class="flex items-center mb-2 p-2 rounded bg-gray-800">
          <img src="${API.getSpellImageUrl(spell.image.full)}" class="w-10 h-10 rounded mr-2" alt="${spell.name}">
          <div>
            <strong>${keys[idx]}: ${spell.name}</strong>
            <p class="text-xs text-gray-300 mb-0">${spell.description.replace(/<[^>]*>/g, '').substring(0, 100)}...</p>
          </div>
        </div>
      `;
    });

    this.elements.championInfoLoader.classList.add('hidden');
    this.elements.championDetails.classList.remove('hidden');
  },

  toggleMode() {
    const isCurrentlyDark = document.body.classList.contains('bg-gray-800');

    if (isCurrentlyDark) {
      document.body.classList.remove('bg-gray-800', 'text-white');
      document.body.classList.add('bg-gray-100', 'text-black');
      this.elements.modeToggle.textContent = 'Modo Oscuro';

      document.querySelectorAll('.card').forEach(card => {
        card.classList.remove('bg-gray-800', 'text-white');
        card.classList.add('bg-gray-100', 'text-black');
      });
      document.querySelector('.modal-content').classList.remove('bg-gray-800', 'text-white');
      document.querySelector('.modal-content').classList.add('bg-gray-100', 'text-black');
    } else {
      document.body.classList.remove('bg-gray-100', 'text-black');
      document.body.classList.add('bg-gray-800', 'text-white');
      this.elements.modeToggle.textContent = 'Modo Claro';

      document.querySelectorAll('.card').forEach(card => {
        card.classList.remove('bg-gray-100', 'text-black');
        card.classList.add('bg-gray-800', 'text-white');
      });
      document.querySelector('.modal-content').classList.remove('bg-gray-100', 'text-black');
      document.querySelector('.modal-content').classList.add('bg-gray-800', 'text-white');
    }
  }
};

// Al final del archivo, agrega el evento para cerrar el modal:
document.getElementById('closeModalBtn').onclick = () => UI.closeModal();
