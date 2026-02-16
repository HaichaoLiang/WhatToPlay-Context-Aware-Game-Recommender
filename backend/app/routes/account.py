import time
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import SteamProfile
from app.services.steam_client import get_player_summaries

account_bp = Blueprint("account", __name__)

@account_bp.post("/bind_steam")
@jwt_required()
def bind_steam():
    user_id = int(get_jwt_identity())
    data = request.get_json(force=True)
    steamid = (data.get("steamid") or "").strip()

    if not steamid.isdigit():
        return jsonify({"error": "invalid_steamid"}), 400

    api_key = current_app.config["STEAM_API_KEY"]
    prof = get_player_summaries(api_key, steamid)
    if not prof:
        return jsonify({"error": "steam_profile_not_found_or_private"}), 404

    sp = SteamProfile.query.filter_by(auth_user_id=user_id).first()
    now = int(time.time())
    if sp:
        sp.steamid = steamid
        sp.persona = prof.get("personaname")
        sp.avatar = prof.get("avatarfull") or prof.get("avatar")
        sp.last_sync_ts = now
    else:
        sp = SteamProfile(
            auth_user_id=user_id,
            steamid=steamid,
            persona=prof.get("personaname"),
            avatar=prof.get("avatarfull") or prof.get("avatar"),
            last_sync_ts=now
        )
        db.session.add(sp)

    db.session.commit()
    return jsonify({
        "ok": True,
        "steam": {"steamid": sp.steamid, "persona": sp.persona, "avatar": sp.avatar}
    }), 200
