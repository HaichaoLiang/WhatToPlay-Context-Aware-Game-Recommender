import os
import sys
import time
import requests
import argparse

# Ensure the Flask app can be imported correctly
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, BASE_DIR)

from app import create_app, db
from app.models import UserGameStat
from app.models_catalog import GameCatalog

STEAMSPY_API_URL = "https://steamspy.com/api.php"


def build_document(name, genres, tags):
    """Build the Document string for text similarity matching."""
    parts = [name]
    if genres: parts.append(genres)
    if tags: parts.append(tags)
    return "\n".join(parts)


def infer_difficulty(tags_dict):
    """Infer difficulty based on SteamSpy user tags."""
    tags_lower = [t.lower() for t in tags_dict.keys()]
    if any(k in tags_lower for k in ["souls-like", "difficult", "hard", "roguelike", "permadeath"]):
        return "high"
    if any(k in tags_lower for k in ["casual", "relaxing", "cozy", "visual novel", "walking simulator"]):
        return "low"
    return "medium"


def infer_multiplayer_mode(tags_dict):
    """Infer multiplayer mode based on SteamSpy user tags."""
    tags_lower = [t.lower() for t in tags_dict.keys()]
    if any(k in tags_lower for k in ["co-op", "online co-op", "local co-op"]):
        return "coop"
    if any(k in tags_lower for k in ["multiplayer", "pvp", "competitive", "e-sports"]):
        return "pvp"
    if any(k in tags_lower for k in ["mmo", "massively multiplayer"]):
        return "mmo"
    return "solo"


def fetch_steamspy_data(appid):
    """Fetch game data from SteamSpy API."""
    try:
        r = requests.get(STEAMSPY_API_URL, params={"request": "appdetails", "appid": appid}, timeout=10)
        r.raise_for_status()
        data = r.json()
        # SteamSpy typically returns empty data or data without a name if the game is not found
        if not data or not data.get("name"):
            return None
        return data
    except Exception as e:
        print(f"Failed to fetch AppID {appid}: {e}")
        return None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=50,
                        help="Max number of games to sync at once (to prevent long runs)")
    args = parser.parse_args()

    app = create_app()
    with app.app_context():
        # 1. Find all AppIDs present in UserGameStat (player's library) but missing in GameCatalog
        # Using a simple set difference operation here
        owned_appids = {stat.appid for stat in db.session.query(UserGameStat.appid).distinct().all()}
        catalog_appids = {c.appid for c in db.session.query(GameCatalog.appid).all()}

        missing_appids = list(owned_appids - catalog_appids)

        if not missing_appids:
            print("Great! All games in the player's library are already in the GameCatalog. No sync needed.")
            return

        print(
            f"Found {len(missing_appids)} games missing metadata. Planning to sync {min(args.limit, len(missing_appids))} games this time...")

        inserted = 0

        for appid in missing_appids[:args.limit]:
            print(f"Requesting data for AppID: {appid} from SteamSpy...", end=" ", flush=True)

            data = fetch_steamspy_data(appid)
            if not data:
                print("No valid data found, skipping.")
                time.sleep(1)  # SteamSpy API rate limit is roughly 4 requests/second
                continue

            name = data.get("name")
            developers = ", ".join(data.get("developer", "").split(", "))
            publishers = ", ".join(data.get("publisher", "").split(", "))
            genres = data.get("genre", "")

            # SteamSpy tags are returned as a dict: {"Action": 1000, "RPG": 500}
            tags_dict = data.get("tags", {})
            tags_str = ", ".join(tags_dict.keys()) if isinstance(tags_dict, dict) else ""

            positive = data.get("positive", 0)
            negative = data.get("negative", 0)

            # 'average_forever' is in minutes, perfectly matching the 'avg_session_minutes' logic!
            # If average playtime is 0 (e.g., brand new game), default to 60 minutes
            avg_session_minutes = data.get("average_forever", 60)
            if avg_session_minutes == 0:
                avg_session_minutes = 60

            # Infer context attributes
            difficulty = infer_difficulty(tags_dict)
            multiplayer_mode = infer_multiplayer_mode(tags_dict)

            # Build Document for search
            document = build_document(name, genres, tags_str)

            # Insert into database
            new_game = GameCatalog(
                appid=appid,
                name=name,
                developers=developers,
                publishers=publishers,
                genres=genres,
                tags=tags_str,
                positive=positive,
                negative=negative,
                avg_session_minutes=avg_session_minutes,
                difficulty=difficulty,
                multiplayer_mode=multiplayer_mode,
                document=document
            )

            db.session.add(new_game)
            inserted += 1
            print("Successfully added to database!")

            # Obey API rate limits
            time.sleep(1)

        db.session.commit()
        print(f"\nSync complete! Added metadata for {inserted} games.")
        print("You can now go back to the webpage and click Generate Recommendation!")


if __name__ == "__main__":
    main()