const UI = {
  elements: {
    championsContainer: document.getElementById("champions"),
    favoriteChampionsContainer: document.getElementById("favoriteChampions"),
    modal: new bootstrap.Modal(document.getElementById('skinsModal')),
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
      targetContainer.innerHTML = '<div class="col-12 text-center text-muted"><p>No tienes campeones favoritos aún.</p></div>';
      return;
    }

    champions.forEach(champ => {
      const card = document.createElement('div');
      card.className = 'col';
      const isFavorite = Favorites.isFavorite(champ.id);
      
      const isLight = document.body.classList.contains('bg-light');
      const cardBg = isLight ? 'bg-white text-dark' : 'bg-secondary text-white';

      card.innerHTML = `
        <div class="card ${cardBg} h-100 champion-card position-relative" data-champ="${champ.id}">
          <button class="btn btn-outline-warning favorite-btn ${isFavorite ? 'active' : ''}" 
                  onclick="event.stopPropagation(); UI.toggleFavorite('${champ.id}', this)">
            ${isFavorite ? '★' : '☆'}
          </button>
          <img src="${API.getChampionImageUrl(champ.image.full)}" class="card-img-top" alt="${champ.name}">
          <div class="card-body">
            <h5 class="card-title">${champ.name}</h5>
            <p class="card-text">${champ.title}</p>
            <span class="badge bg-info text-dark">Skins: ${championSkinsCount[champ.id] || '-'}</span>
          </div>
        </div>
      `;
      card.querySelector('.champion-card').onclick = () => this.showSkins(champ.id, champ.name);
      targetContainer.appendChild(card);
    });
  },

  toggleFavorite(championId, button) {
    const isFavorite = Favorites.toggleFavorite(championId);
    button.classList.toggle('active', isFavorite);
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

  async showSkins(champId, champName) {
    this.elements.skinsLoader.classList.remove('d-none');
    this.elements.championInfoLoader.classList.remove('d-none');
    this.elements.championDetails.classList.add('d-none');
    this.elements.carouselInner.innerHTML = '';
    this.elements.modalTitle.textContent = champName;
    
    const modalContent = document.querySelector('.modal-content');
    if (document.body.classList.contains('bg-light')) {
      modalContent.classList.remove('bg-dark', 'text-white');
      modalContent.classList.add('bg-white', 'text-dark');
    } else {
      modalContent.classList.remove('bg-white', 'text-dark');
      modalContent.classList.add('bg-dark', 'text-white');
    }

    const championData = await API.getChampionDetails(champId);
    if (championData) {
      // Cargar información del campeón
      this.loadChampionInfo(championData);
      
      // Cargar skins con preload
      await this.loadSkins(champId, champName, championData.skins);
      
      // Cargar runas y builds
      this.loadRunesAndBuilds(champId);

      this.elements.modal.show();
    }
  },

  async loadSkins(champId, champName, skins) {
    // Precargar todas las imágenes
    await API.preloadSkinImages(champId, skins);
    
    this.elements.carouselInner.innerHTML = '';
    skins.forEach((skin, idx) => {
      const activeClass = idx === 0 ? 'active' : '';
      this.elements.carouselInner.innerHTML += `
        <div class="carousel-item ${activeClass}">
          <img src="${API.getSkinSplashUrl(champId, skin.num)}" class="d-block w-100" alt="${skin.name}">
          <div class="carousel-caption d-none d-md-block">
            <h5>${skin.name === 'default' ? champName : skin.name}</h5>
          </div>
        </div>
      `;
    });
    
    this.elements.skinsLoader.classList.add('d-none');
  },

  async loadRunesAndBuilds(champId) {
    const runesContent = document.getElementById('championRunesContent');
    const buildsContent = document.getElementById('championBuildsContent');
    runesContent.innerHTML = '<div class="text-center"><div class="spinner-border"></div></div>';
    buildsContent.innerHTML = '<div class="text-center"><div class="spinner-border"></div></div>';

    try {
      const res = await fetch(`https://stats2.u.gg/lol/1.5/champion/${champId}/ranked_solo_5x5/14_13.json`);
      const data = await res.json();

      // Runas
      if (data.runes && data.runes.length > 0) {
        runesContent.innerHTML = data.runes.map(runeSet => `
          <div class="mb-2">
            <strong>${runeSet.primary_style_name}</strong>
            <div>
              ${runeSet.primary_runes.map(rune => `
                <img src="${rune.icon}" title="${rune.name}" style="width:32px;height:32px;margin-right:4px;">
              `).join('')}
            </div>
            <small class="text-muted">Secundaria: ${runeSet.secondary_style_name}</small>
            <div>
              ${runeSet.secondary_runes.map(rune => `
                <img src="${rune.icon}" title="${rune.name}" style="width:32px;height:32px;margin-right:4px;">
              `).join('')}
            </div>
            <div>
              ${runeSet.stat_mods.map(mod => `
                <img src="${mod.icon}" title="${mod.name}" style="width:24px;height:24px;margin-right:2px;">
              `).join('')}
            </div>
          </div>
        `).join('');
      } else {
        runesContent.innerHTML = '<div class="text-center text-muted">No hay datos de runas disponibles.</div>';
      }

      // Builds
      if (data.items && data.items.length > 0) {
        buildsContent.innerHTML = data.items.map(build => `
          <div class="mb-2">
            <strong>${build.type === 'starting' ? 'Inicio' : 'Build principal'}</strong>
            <div>
              ${build.items.map(item => `
                <img src="https://static.u.gg/assets/lol/riot_static/14.13.1/img/item/${item.id}.png" title="${item.name}" style="width:32px;height:32px;margin-right:4px;">
              `).join('')}
            </div>
          </div>
        `).join('');
      } else {
        buildsContent.innerHTML = '<div class="text-center text-muted">No hay datos de builds disponibles.</div>';
      }
    } catch (e) {
      runesContent.innerHTML = '<div class="text-center text-danger">Error al cargar runas.</div>';
      buildsContent.innerHTML = '<div class="text-center text-danger">Error al cargar builds.</div>';
    }
  },

  loadChampionInfo(championData) {
    // Lore
    const lore = championData.lore;
    const loreElem = this.elements.championLore;
    loreElem.textContent = '';
    // Elimina botón previo si existe
    const prevBtn = document.getElementById('loreReadMoreBtn');
    if (prevBtn) prevBtn.remove();

    if (lore.length > 500) {
      // Crear nodo de texto y botón
      const shortText = document.createTextNode(lore.substring(0, 500) + '...');
      const btn = document.createElement('button');
      btn.id = 'loreReadMoreBtn';
      btn.className = 'btn btn-link btn-sm p-0 ms-2 align-baseline';
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
      `<span class="badge bg-primary me-1">${tag}</span>`
    ).join('');
    
    // Stats
    const stats = championData.stats;
    this.elements.championStats.innerHTML = `
      <div class="mb-2">
        <small>Ataque: ${stats.attackdamage}</small>
        <div class="stat-bar">
          <div class="stat-fill" style="width: ${(stats.attackdamage / 100) * 100}%"></div>
        </div>
      </div>
      <div class="mb-2">
        <small>Defensa: ${stats.armor}</small>
        <div class="stat-bar">
          <div class="stat-fill" style="width: ${(stats.armor / 50) * 100}%"></div>
        </div>
      </div>
      <div class="mb-2">
        <small>Magia: ${stats.attackspeed}</small>
        <div class="stat-bar">
          <div class="stat-fill" style="width: ${(stats.attackspeed / 1) * 100}%"></div>
        </div>
      </div>
    `;
    
    // Habilidades
    this.elements.championSpells.innerHTML = '';
    
    // Pasiva
    if (championData.passive) {
      this.elements.championSpells.innerHTML += `
        <div class="ability-item d-flex">
          <img src="${API.getPassiveImageUrl(championData.passive.image.full)}" class="ability-icon" alt="Pasiva">
          <div>
            <strong>Pasiva: ${championData.passive.name}</strong>
            <p class="small mb-0">${championData.passive.description.replace(/<[^>]*>/g, '').substring(0, 100)}...</p>
          </div>
        </div>
      `;
    }
    
    // Habilidades
    championData.spells.forEach((spell, idx) => {
      const keys = ['Q', 'W', 'E', 'R'];
      this.elements.championSpells.innerHTML += `
        <div class="ability-item d-flex">
          <img src="${API.getSpellImageUrl(spell.image.full)}" class="ability-icon" alt="${spell.name}">
          <div>
            <strong>${keys[idx]}: ${spell.name}</strong>
            <p class="small mb-0">${spell.description.replace(/<[^>]*>/g, '').substring(0, 100)}...</p>
          </div>
        </div>
      `;
    });
    
    this.elements.championInfoLoader.classList.add('d-none');
    this.elements.championDetails.classList.remove('d-none');
  },

  toggleMode() {
    const isCurrentlyDark = document.body.classList.contains('bg-dark');

    if (isCurrentlyDark) {
      document.body.classList.remove('bg-dark', 'text-white');
      document.body.classList.add('bg-light', 'text-dark');
      this.elements.modeToggle.textContent = 'Modo Oscuro';

      document.querySelectorAll('.card').forEach(card => {
        card.classList.remove('bg-secondary', 'text-white');
        card.classList.add('bg-white', 'text-dark');
      });
      document.querySelector('.modal-content').classList.remove('bg-dark', 'text-white');
      document.querySelector('.modal-content').classList.add('bg-white', 'text-dark');
    } else {
      document.body.classList.remove('bg-light', 'text-dark');
      document.body.classList.add('bg-dark', 'text-white');
      this.elements.modeToggle.textContent = 'Modo Claro';

      document.querySelectorAll('.card').forEach(card => {
        card.classList.remove('bg-white', 'text-dark');
        card.classList.add('bg-secondary', 'text-white');
      });
      document.querySelector('.modal-content').classList.remove('bg-white', 'text-dark');
      document.querySelector('.modal-content').classList.add('bg-dark', 'text-white');
    }
  }
};
