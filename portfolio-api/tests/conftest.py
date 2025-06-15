import sys
import types
class DummyClient:
    def call_api(self, *args, **kwargs):
        return {}
sys.modules.setdefault("data_api", types.SimpleNamespace(ApiClient=DummyClient))
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import pytest
from flask import Flask
from src.models.user import db
from src.routes.user import user_bp
from src.routes.portfolio import portfolio_bp
from src.routes.import_routes import import_bp
from src.routes.fx import fx_bp

@pytest.fixture
def app():
    os.environ.setdefault('PORTFOLIO_BASE_CCY', 'USD')
    app = Flask(__name__)
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    with app.app_context():
        db.create_all()
    app.register_blueprint(user_bp, url_prefix='/api')
    app.register_blueprint(portfolio_bp, url_prefix='/api/portfolio')
    app.register_blueprint(import_bp, url_prefix='/api/import')
    app.register_blueprint(fx_bp, url_prefix='/api/fx')
    yield app

@pytest.fixture
def client(app):
    return app.test_client()
