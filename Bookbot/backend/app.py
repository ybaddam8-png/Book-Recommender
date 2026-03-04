from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from rag_pipeline import RAGPipeline
import os

app = Flask(__name__, static_folder="../frontend", static_url_path="")
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "..", "dataset", "books_final_cleaned.csv")
FRONTEND_DIR = os.path.join(BASE_DIR, "..", "frontend")

rag = RAGPipeline()


@app.route("/")
def index():
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.route("/<path:path>")
def serve_static(path):
    return send_from_directory(FRONTEND_DIR, path)


@app.route("/chat", methods=["POST"])
def chat():
    user_query = request.json.get("message")

    result = rag.query(user_query)

    return jsonify(result)


if __name__ == "__main__":
    app.run(debug=True)
