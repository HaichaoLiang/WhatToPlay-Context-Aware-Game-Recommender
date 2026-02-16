import requests

STEAM_BASE = "https://api.steampowered.com"

def get_player_summaries(api_key: str, steamid: str) -> dict:
    url = f"{STEAM_BASE}/ISteamUser/GetPlayerSummaries/v2/"
    r = requests.get(url, params={"key": api_key, "steamids": steamid}, timeout=15)
    r.raise_for_status()
    players = r.json().get("response", {}).get("players", [])
    return players[0] if players else {}

def get_owned_games(api_key: str, steamid: str) -> list[dict]:
    url = f"{STEAM_BASE}/IPlayerService/GetOwnedGames/v1/"
    r = requests.get(url, params={
        "key": api_key,
        "steamid": steamid,
        "include_appinfo": False,
        "include_played_free_games": True
    }, timeout=20)
    r.raise_for_status()
    return r.json().get("response", {}).get("games", [])
