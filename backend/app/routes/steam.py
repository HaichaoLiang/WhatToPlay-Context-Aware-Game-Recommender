import time
from flask import Blueprint, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.dialects.mysql import insert as mysql_insert

from app import db
from app.models import SteamProfile, UserGameStat
from app.services.steam_client import get_owned_games

steam_bp = Blueprint("steam", __name__)

@steam_bp.post("/sync")
@jwt_required()
def sync_owned_games():
    """
    Pull owned games from Steam Web API for the bound steamid,
    then UPSERT into user_game_stats.
    """
    user_id = int(get_jwt_identity())

    # Must have bound steam profile
    sp = SteamProfile.query.filter_by(auth_user_id=user_id).first()
    if not sp:
        return jsonify({"error": "steam_not_bound"}), 400

    # Must have steam api key
    api_key = current_app.config.get("STEAM_API_KEY", "")
    if not api_key:
        return jsonify({"error": "steam_api_key_missing"}), 500

    # Call Steam API
    games = get_owned_games(api_key, sp.steamid)
    now = int(time.time())

    if not games:
        # Could be private profile OR no games OR API returned empty
        sp.last_sync_ts = now
        db.session.commit()
        return jsonify({
            "ok": True,
            "steamid": sp.steamid,
            "synced": 0,
            "note": "no_games_returned (profile may be private or library empty)",
            "updated_at": now
        }), 200

    # Prepare rows for upsert
    rows = []
    for g in games:
        rows.append({
            "steamid": sp.steamid,
            "appid": int(g.get("appid")),
            "playtime_forever": int(g.get("playtime_forever", 0)),
            "playtime_2weeks": int(g.get("playtime_2weeks", 0)),
            "last_played": int(g.get("rtime_last_played") or 0) or None
        })

    # MySQL UPSERT with ON DUPLICATE KEY UPDATE
    stmt = mysql_insert(UserGameStat).values(rows)
    stmt = stmt.on_duplicate_key_update(
        playtime_forever=stmt.inserted.playtime_forever,
        playtime_2weeks=stmt.inserted.playtime_2weeks,
        last_played=stmt.inserted.last_played
    )

    db.session.execute(stmt)

    # Update sync timestamp
    sp.last_sync_ts = now
    db.session.commit()

    return jsonify({
        "ok": True,
        "steamid": sp.steamid,
        "synced": len(rows),
        "updated_at": now
    }), 200
