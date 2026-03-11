from flask import Flask
from flask_cors import CORS
import os


def create_app():
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    FRONTEND_DIR = os.path.join(BASE_DIR, "..", "..", "frontend")

    app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="")
    CORS(app)

    from .routes import main
    app.register_blueprint(main)

    return app