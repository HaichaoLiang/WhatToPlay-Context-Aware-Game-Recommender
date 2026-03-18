from datetime import datetime
import json
import math
import time
from dataclasses import dataclass

from app.models import Feedback, UserPreference


@dataclass
class RecommendationContext:
    time_available_min: int
    energy_level: str
    platform: str
    social_mode: str
    prefer_installed: bool
    friends_online_count: int


def normalize_genres(raw_genres: str):
    if not raw_genres:
        return []
    parts = []
    for sep in [",", ";", "|"]:
        if sep in raw_genres:
            parts = [p.strip().lower() for p in raw_genres.split(sep)]
            break
    if not parts:
        parts = [raw_genres.strip().lower()]
    return [p for p in parts if p]


def parse_preference(pref: UserPreference):
    if not pref or not pref.genre_weights:
        return {}
    try:
        data = json.loads(pref.genre_weights)
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def clamp(v, lo, hi):
    return max(lo, min(hi, v))


def recency_days(last_played_ts: int | None):
    if not last_played_ts:
        return None
    now = int(time.time())
    if last_played_ts > now:
        return 0
    return (now - last_played_ts) / 86400


def quality_signal(catalog):
    score = 0.0

    metacritic = getattr(catalog, "metacritic_score", None)
    if metacritic is not None:
        score += clamp((float(metacritic) - 75.0) / 10.0, -2.0, 2.5)

    positive = getattr(catalog, "positive", 0) or 0
    negative = getattr(catalog, "negative", 0) or 0
    total = positive + negative
    if total > 0:
        approval = positive / total
        confidence = min(1.0, math.log10(total + 1) / 3.0)
        score += clamp((approval - 0.72) * 18.0 * confidence, -2.5, 3.5)

    return score


def score_candidate(game_stat, catalog, ctx: RecommendationContext, genre_weights: dict, comfort_bias: float):
    reasons = []
    score = 0.0

    # Time fit: prefer session length close to available time.
    target = catalog.avg_session_minutes or 45
    diff = abs(ctx.time_available_min - target)
    time_fit = max(0.0, 1.0 - (diff / max(ctx.time_available_min, 30)))
    score += time_fit * 35
    if time_fit > 0.7:
        reasons.append(f"Fits your {target} minute session window")

    # Energy fit: low-energy prefers lower difficulty.
    difficulty = (catalog.difficulty or "medium").lower()
    if ctx.energy_level == "low":
        if difficulty in ("low", "easy"):
            score += 20
            reasons.append("Low mental load")
        elif difficulty in ("high", "hard"):
            score -= 10
    else:
        if difficulty in ("high", "hard"):
            score += 18
            reasons.append("Good fit for high energy")

    # Social fit + friends online boost.
    mode = (catalog.multiplayer_mode or "solo").lower()
    if ctx.social_mode == "social":
        if mode in ("coop", "pvp", "mmo", "multiplayer"):
            social = 10 + min(10, ctx.friends_online_count * 2)
            score += social
            reasons.append("Friends online can join")
        else:
            score -= 4
    elif ctx.social_mode == "solo" and mode in ("solo", "singleplayer"):
        score += 8

    # Genre preference fit.
    gfit = 0.0
    for g in normalize_genres(catalog.genres):
        gfit = max(gfit, float(genre_weights.get(g, 0.0)))
    if gfit > 0:
        score += clamp(gfit, 0, 4) * 6
        reasons.append("Matches your genre preferences")

    # Comfort loop bias from historical behavior
    if game_stat.playtime_forever and game_stat.playtime_forever > 500:
        score += comfort_bias * 8
        if comfort_bias > 0.7:
            reasons.append("Aligned with your comfort picks")

    # Installation / readiness proxy (Steam owned games don't always expose install state).
    # We treat very recent activity as "ready to launch" when user prefers installed titles.
    if ctx.prefer_installed:
        recent_days = recency_days(game_stat.last_played)
        if game_stat.playtime_2weeks and game_stat.playtime_2weeks > 0:
            score += 5
            reasons.append("Recently active in your library")
        elif recent_days is not None and recent_days <= 30:
            score += 3
        else:
            score -= 2

    # Novelty bonus for backlog items
    if (game_stat.playtime_forever or 0) < 30:
        score += 6

    # Re-engagement boost for long-tail games: played before, but not in recent months.
    recent_days = recency_days(game_stat.last_played)
    if recent_days is not None and recent_days >= 90 and (game_stat.playtime_forever or 0) >= 60:
        score += 4
        reasons.append("Good time to revisit")

    # Mild fatigue penalty for heavily played titles with no recent activity.
    if (game_stat.playtime_forever or 0) > 2000 and (recent_days is None or recent_days > 180):
        score -= 5

    # Recent activity tiny boost
    if game_stat.playtime_2weeks and game_stat.playtime_2weeks > 0:
        score += min(5, math.log2(1 + game_stat.playtime_2weeks / 30))

    signal = quality_signal(catalog)
    score += signal
    if signal >= 2:
        reasons.append("Strong overall quality signal")

    return score, reasons[:3]


def update_user_preference(db, auth_user_id: int, appid: int, action: str, genres: str, context_snapshot: dict):
    now = int(time.time())
    db.session.add(Feedback(
        auth_user_id=auth_user_id,
        appid=appid,
        action=action,
        ts=now,
        context_snapshot=json.dumps(context_snapshot, ensure_ascii=False),
    ))

    pref = UserPreference.query.filter_by(auth_user_id=auth_user_id).first()
    if not pref:
        pref = UserPreference(auth_user_id=auth_user_id, genre_weights=json.dumps({}), comfort_bias=0.0)
        db.session.add(pref)
        db.session.flush()

    weights = parse_preference(pref)
    if action == "accept":
        delta = 0.15
    elif action == "reject":
        delta = -0.1
    else:
        delta = 0.02
    if action == "reject":
        pref.comfort_bias = clamp(pref.comfort_bias - 0.03, -1.0, 2.0)
    elif action == "accept":
        pref.comfort_bias = clamp(pref.comfort_bias + 0.05, -1.0, 2.0)

    for g in normalize_genres(genres):
        weights[g] = round(clamp(float(weights.get(g, 0.0)) + delta, -3.0, 5.0), 3)

    pref.genre_weights = json.dumps(weights, ensure_ascii=False)
    pref.updated_at = datetime.utcnow()
