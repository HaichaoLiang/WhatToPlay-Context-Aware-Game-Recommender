import time
import unittest
from types import SimpleNamespace

from app.services.recommender import RecommendationContext, score_candidate


class RecommenderRankingTests(unittest.TestCase):
    def make_ctx(self, prefer_installed=True):
        return RecommendationContext(
            time_available_min=60,
            energy_level="low",
            platform="windows",
            social_mode="any",
            prefer_installed=prefer_installed,
            friends_online_count=0,
        )

    def make_catalog(self):
        return SimpleNamespace(
            avg_session_minutes=60,
            difficulty="low",
            multiplayer_mode="solo",
            genres="rpg",
            metacritic_score=None,
            positive=0,
            negative=0,
        )

    def make_stat(self, **kwargs):
        data = {
            "playtime_forever": 100,
            "playtime_2weeks": 0,
            "last_played": None,
        }
        data.update(kwargs)
        return SimpleNamespace(**data)

    def test_prefer_installed_boosts_recent_activity(self):
        cat = self.make_catalog()
        now = int(time.time())

        active_stat = self.make_stat(playtime_2weeks=120, last_played=now - 86400)
        stale_stat = self.make_stat(playtime_2weeks=0, last_played=now - 86400 * 120)

        active_score, _ = score_candidate(active_stat, cat, self.make_ctx(prefer_installed=True), {}, 0.0)
        stale_score, _ = score_candidate(stale_stat, cat, self.make_ctx(prefer_installed=True), {}, 0.0)

        self.assertGreater(active_score, stale_score)

    def test_fatigue_penalty_applies_to_very_old_heavy_games(self):
        cat = self.make_catalog()
        now = int(time.time())

        heavy_old = self.make_stat(playtime_forever=3000, last_played=now - 86400 * 365)
        heavy_recent = self.make_stat(playtime_forever=3000, last_played=now - 86400 * 7, playtime_2weeks=60)

        old_score, _ = score_candidate(heavy_old, cat, self.make_ctx(), {}, 0.0)
        recent_score, _ = score_candidate(heavy_recent, cat, self.make_ctx(), {}, 0.0)

        self.assertGreater(recent_score, old_score)

    def test_quality_signal_breaks_ties_between_otherwise_similar_games(self):
        high_quality = self.make_catalog()
        high_quality.metacritic_score = 90
        high_quality.positive = 920
        high_quality.negative = 80

        lower_quality = self.make_catalog()
        lower_quality.metacritic_score = 78
        lower_quality.positive = 180
        lower_quality.negative = 120

        stat = self.make_stat(playtime_forever=240, playtime_2weeks=0, last_played=None)

        high_score, _ = score_candidate(stat, high_quality, self.make_ctx(), {}, 0.0)
        low_score, _ = score_candidate(stat, lower_quality, self.make_ctx(), {}, 0.0)

        self.assertGreater(high_score, low_score)

if __name__ == "__main__":
    unittest.main()
