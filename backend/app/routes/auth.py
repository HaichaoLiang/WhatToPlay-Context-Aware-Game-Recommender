from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app import db
from app.models import AuthUser, SteamProfile
from app.services.security import hash_password, verify_password

auth_bp = Blueprint("auth", __name__)

@auth_bp.post("/register")
def register():
    data = request.get_json(force=True)
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or "@" not in email:
        return jsonify({"error": "invalid_email"}), 400
    if len(password) < 8:
        return jsonify({"error": "password_too_short", "minLength": 8}), 400
    if AuthUser.query.filter_by(email=email).first():
        return jsonify({"error": "email_exists"}), 409

    user = AuthUser(email=email, password_hash=hash_password(password))
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({"access_token": token, "user": {"id": user.id, "email": user.email}}), 201

@auth_bp.post("/login")
def login():
    data = request.get_json(force=True)
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    user = AuthUser.query.filter_by(email=email).first()
    if not user or not verify_password(password, user.password_hash):
        return jsonify({"error": "invalid_credentials"}), 401

    token = create_access_token(identity=str(user.id))
    sp = SteamProfile.query.filter_by(auth_user_id=user.id).first()

    return jsonify({
        "access_token": token,
        "user": {"id": user.id, "email": user.email},
        "steam": {"steamid": sp.steamid, "persona": sp.persona, "avatar": sp.avatar} if sp else None
    }), 200

@auth_bp.get("/me")
@jwt_required()
def me():
    user_id = int(get_jwt_identity())
    user = AuthUser.query.get(user_id)
    sp = SteamProfile.query.filter_by(auth_user_id=user_id).first()
    return jsonify({
        "user": {"id": user.id, "email": user.email},
        "steam": {"steamid": sp.steamid, "persona": sp.persona, "avatar": sp.avatar} if sp else None
    }), 200
