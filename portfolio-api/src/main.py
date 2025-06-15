import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from src.models.user import db
from src.models.portfolio import Stock, Transaction
from src.routes.user import user_bp
from src.routes.portfolio import portfolio_bp
from src.routes.import_routes import import_bp
from src.routes.fx import fx_bp
from src.config import SQLALCHEMY_DATABASE_URI

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
# Enable CORS for all API routes
CORS(app, resources={r"/api/*": {"origins": "*"}})
# Allow SECRET_KEY to be configured via environment variable for flexibility
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'asdf#FGSgvasgf$5$WGT')
from src.config import PORTFOLIO_BASE_CCY
app.config['PORTFOLIO_BASE_CCY'] = PORTFOLIO_BASE_CCY
app.config['BASE_CURRENCY'] = PORTFOLIO_BASE_CCY

app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(portfolio_bp, url_prefix='/api/portfolio')
app.register_blueprint(import_bp, url_prefix='/api/import')
app.register_blueprint(fx_bp, url_prefix='/api/fx')

# uncomment if you need to use database
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', SQLALCHEMY_DATABASE_URI)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)
with app.app_context():
    db.create_all()

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
            return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
