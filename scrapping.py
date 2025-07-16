import requests
from bs4 import BeautifulSoup
import pandas as pd
import time

HEADERS = {"User-Agent": "Mozilla/5.0"}

def get_champion_list():
    url = "https://u.gg/lol/champions"
    resp = requests.get(url, headers=HEADERS)
    if resp.status_code != 200:
        print("Error al obtener la lista de campeones")
        return []

    soup = BeautifulSoup(resp.text, "html.parser")
    champions = []
    a_tags = soup.find_all("a", class_="group w-full mx-auto")
    for a in a_tags:
        href = a.get("href", "")
        parts = href.split('/')
        if len(parts) >= 4:
            champion_name = parts[3]
            champions.append(champion_name)

    return champions

def get_runes_only(champion_name):
    url = f"https://u.gg/lol/champions/{champion_name}/build"
    resp = requests.get(url, headers=HEADERS)
    if resp.status_code != 200:
        print(f"Error al acceder a {champion_name}")
        return None

    soup = BeautifulSoup(resp.text, "html.parser")

    # Obtener runas activas
    rune_imgs = soup.select(".perk-active img, .shard-active img")
    runes = [img["src"] for img in rune_imgs if img.get("src")]

    return {
        "Champion": champion_name,
        "Runes": ", ".join(runes)
    }

def main():
    champions = get_champion_list()
    print(f"Campeones encontrados: {len(champions)}")

    data = []
    for i, champ in enumerate(champions, 1):
        print(f"[{i}/{len(champions)}] Obteniendo runas de {champ}")
        result = get_runes_only(champ) 
        if result:
            data.append(result)
        time.sleep(1)  # para evitar ser bloqueado por el servidor

    df = pd.DataFrame(data)
    df.to_csv("lol_runes_top.csv", index=False)
    print("Archivo guardado como lol_runes_top.csv")


if __name__ == "__main__":
    main()
