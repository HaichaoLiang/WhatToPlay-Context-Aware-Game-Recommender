from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from .config import Config

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, resources={r"/api/*": {"origins": "*"}})

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    from . import models
    from . import models_catalog

    from .routes.health import health_bp
    from .routes.auth import auth_bp
    from .routes.account import account_bp
    from .routes.steam import steam_bp
    from .routes.search import search_bp
    from .routes.recommend import recommend_bp

    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(account_bp, url_prefix="/api/account")
    app.register_blueprint(steam_bp, url_prefix="/api/steam")
    app.register_blueprint(search_bp, url_prefix="/api/search")
    app.register_blueprint(recommend_bp, url_prefix="/api/recommend")

    return app
