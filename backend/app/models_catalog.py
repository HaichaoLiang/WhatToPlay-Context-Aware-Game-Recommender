from app import db
from sqlalchemy.dialects.mysql import LONGTEXT


class GameCatalog(db.Model):
    __tablename__ = "game_catalog"

    appid = db.Column(db.Integer, primary_key=True)

    # widen to reduce failures, still indexable
    name = db.Column(db.String(512), nullable=False, index=True)

    release_date = db.Column(db.String(64), nullable=True)
    price = db.Column(db.Float, nullable=True)

    about = db.Column(LONGTEXT, nullable=True)
    supported_languages = db.Column(LONGTEXT, nullable=True)
    full_audio_languages = db.Column(LONGTEXT, nullable=True)

    developers = db.Column(LONGTEXT, nullable=True)
    publishers = db.Column(LONGTEXT, nullable=True)

    categories = db.Column(LONGTEXT, nullable=True)
    genres = db.Column(LONGTEXT, nullable=True)
    tags = db.Column(LONGTEXT, nullable=True)

    header_image = db.Column(LONGTEXT, nullable=True)
    website = db.Column(LONGTEXT, nullable=True)

    windows = db.Column(db.Boolean, nullable=True)
    mac = db.Column(db.Boolean, nullable=True)
    linux = db.Column(db.Boolean, nullable=True)

    metacritic_score = db.Column(db.Integer, nullable=True)
    positive = db.Column(db.Integer, nullable=True)
    negative = db.Column(db.Integer, nullable=True)

    avg_session_minutes = db.Column(db.Integer, nullable=True)
    multiplayer_mode = db.Column(db.String(64), nullable=True)  # solo/coop/pvp/mmo
    difficulty = db.Column(db.String(32), nullable=True)
    
    document = db.Column(LONGTEXT, nullable=True)

    def to_dict(self):
        return {
            "appid": self.appid,
            "name": self.name,
            "release_date": self.release_date,
            "price": self.price,
            "developers": self.developers,
            "publishers": self.publishers,
            "categories": self.categories,
            "genres": self.genres,
            "tags": self.tags,
            "header_image": self.header_image,
            "website": self.website,
            "windows": self.windows,
            "mac": self.mac,
            "linux": self.linux,
            "metacritic_score": self.metacritic_score,
            "positive": self.positive,
            "negative": self.negative,
        }
