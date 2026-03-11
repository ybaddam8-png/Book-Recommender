from flask import Blueprint, request, jsonify, send_from_directory
import os
from .services.chat_service import ChatService

main = Blueprint("main", __name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, "../../frontend")

chat_service = ChatService()


@main.route("/")
def index():
    return send_from_directory(FRONTEND_DIR, "index.html")


@main.route("/<path:path>")
def serve_static(path):
    return send_from_directory(FRONTEND_DIR, path)


@main.route("/chat", methods=["POST"])
def chat():
    user_query = request.json.get("message")

    result = chat_service.process_query(user_query)

    return jsonify(result)