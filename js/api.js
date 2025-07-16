const API = {
  BASE_URL: 'https://ddragon.leagueoflegends.com/cdn/14.14.1',
  
  async getChampions() {
    try {
      const response = await fetch(`${this.BASE_URL}/data/es_ES/champion.json`);
      const data = await response.json();
      return Object.values(data.data);
    } catch (error) {
      console.error('Error fetching champions:', error);
      return [];
    }
  },

  async getChampionDetails(championId) {
    try {
      const response = await fetch(`${this.BASE_URL}/data/es_ES/champion/${championId}.json`);
      const data = await response.json();
      return data.data[championId];
    } catch (error) {
      console.error('Error fetching champion details:', error);
      return null;
    }
  },

  getChampionImageUrl(imageFull) {
    return `${this.BASE_URL}/img/champion/${imageFull}`;
  },

  getSkinSplashUrl(championId, skinNum) {
    return `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${championId}_${skinNum}.jpg`;
  },

  getSpellImageUrl(spellImage) {
    return `${this.BASE_URL}/img/spell/${spellImage}`;
  },

  getPassiveImageUrl(passiveImage) {
    return `${this.BASE_URL}/img/passive/${passiveImage}`;
  },

  async preloadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  },

  async preloadSkinImages(championId, skins) {
    const promises = skins.map(skin => 
      this.preloadImage(this.getSkinSplashUrl(championId, skin.num))
    );
    return Promise.allSettled(promises);
  }
};
