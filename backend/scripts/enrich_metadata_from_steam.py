import os
import sys
import argparse

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, BASE_DIR)

from app import create_app, db  # noqa: E402
from app.models_catalog import GameCatalog  # noqa: E402
from app.services.steam_client import get_app_details  # noqa: E402


def infer_multiplayer_mode(categories):
    names = {c.get("description", "").lower() for c in categories or []}
    if any("co-op" in n or "coop" in n for n in names):
        return "coop"
    if any("pvp" in n or "multiplayer" in n for n in names):
        return "pvp"
    if any("mmo" in n for n in names):
        return "mmo"
    return "solo"


def infer_difficulty(tags, genres):
    source = " ".join(tags + genres).lower()
    if any(k in source for k in ["souls", "hard", "difficult", "roguelike"]):
        return "high"
    if any(k in source for k in ["casual", "relax", "cozy", "visual novel"]):
        return "low"
    return "medium"


def infer_session_minutes(genres):
    src = " ".join(genres).lower()
    if any(k in src for k in ["strategy", "rpg", "grand strategy"]):
        return 90
    if any(k in src for k in ["roguelike", "action", "fps", "fight"]):
        return 45
    return 60


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=100)
    parser.add_argument("--offset", type=int, default=0)
    args = parser.parse_args()

    app = create_app()
    with app.app_context():
        rows = (
            db.session.query(GameCatalog)
            .order_by(GameCatalog.appid.asc())
            .offset(args.offset)
            .limit(args.limit)
            .all()
        )

        updated = 0
        for row in rows:
            details = get_app_details(row.appid)
            if not details:
                continue

            categories = details.get("categories") or []
            genres = [g.get("description", "") for g in (details.get("genres") or []) if g.get("description")]
            tags = []

            if not row.multiplayer_mode:
                row.multiplayer_mode = infer_multiplayer_mode(categories)
            if not row.difficulty:
                row.difficulty = infer_difficulty(tags, genres)
            if not row.avg_session_minutes:
                row.avg_session_minutes = infer_session_minutes(genres)
            updated += 1

        db.session.commit()
        print(f"updated={updated}, scanned={len(rows)}")


if __name__ == "__main__":
    main()