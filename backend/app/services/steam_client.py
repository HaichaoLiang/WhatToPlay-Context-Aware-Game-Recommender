import requests

STEAM_BASE = "https://api.steampowered.com"

def get_player_summaries(api_key: str, steamid: str):
    url = f"{STEAM_BASE}/ISteamUser/GetPlayerSummaries/v2/"
    r = requests.get(url, params={"key": api_key, "steamids": steamid}, timeout=15)
    r.raise_for_status()
    players = r.json().get("response", {}).get("players", [])
    if "," in steamid:
        return players
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

def get_friend_online_count(api_key: str, steamid: str) -> int:
    if not api_key:
        return 0

    try:
        friends_url = f"{STEAM_BASE}/ISteamUser/GetFriendList/v1/"
        fr = requests.get(friends_url, params={"key": api_key, "steamid": steamid, "relationship": "friend"}, timeout=15)
        fr.raise_for_status()
        friends = fr.json().get("friendslist", {}).get("friends", [])
        if not friends:
            return 0

        ids = ",".join([f.get("steamid") for f in friends[:100] if f.get("steamid")])
        if not ids:
            return 0

        summaries = get_player_summaries(api_key, ids)
        players = summaries if isinstance(summaries, list) else [summaries]
        return sum(1 for p in players if int(p.get("personastate", 0)) > 0)
    except Exception:
        return 0


def get_app_details(appid: int, country: str = "us") -> dict:
    url = "https://store.steampowered.com/api/appdetails"
    r = requests.get(url, params={"appids": int(appid), "cc": country, "l": "english"}, timeout=20)
    r.raise_for_status()
    payload = r.json().get(str(appid), {})
    if not payload.get("success"):
        return {}
    return payload.get("data", {}) or {}
