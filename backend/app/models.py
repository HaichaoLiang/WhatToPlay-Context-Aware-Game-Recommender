from datetime import datetime
from . import db

class AuthUser(db.Model):
    __tablename__ = "auth_users"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

class SteamProfile(db.Model):
    """
    MVP: one login account binds one SteamID.
    """
    __tablename__ = "steam_profiles"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    auth_user_id = db.Column(db.Integer, db.ForeignKey("auth_users.id"), unique=True, index=True, nullable=False)

    steamid = db.Column(db.String(32), unique=True, nullable=False, index=True)
    persona = db.Column(db.String(255), nullable=True)
    avatar = db.Column(db.String(512), nullable=True)
    last_sync_ts = db.Column(db.BigInteger, nullable=True)

class UserGameStat(db.Model):
    __tablename__ = "user_game_stats"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    steamid = db.Column(db.String(32), index=True, nullable=False)
    appid = db.Column(db.Integer, index=True, nullable=False)

    playtime_forever = db.Column(db.Integer, default=0)  # minutes
    playtime_2weeks = db.Column(db.Integer, default=0)   # minutes
    last_played = db.Column(db.BigInteger, nullable=True)

    __table_args__ = (
        db.UniqueConstraint("steamid", "appid", name="uq_user_game"),
    )

class Feedback(db.Model):
    __tablename__ = "feedback"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    auth_user_id = db.Column(db.Integer, index=True, nullable=False)
    appid = db.Column(db.Integer, index=True, nullable=False)
    action = db.Column(db.String(32), nullable=False)  # accept/reject/click
    ts = db.Column(db.BigInteger, nullable=False)
