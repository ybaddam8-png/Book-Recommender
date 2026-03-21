from flask import Blueprint, request, jsonify, send_from_directory, Response, stream_with_context
import os
import requests
import json
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


@main.route("/explain", methods=["POST"])
def explain():
    data = request.get_json()
    title  = data.get("title", "").strip()
    author = data.get("author", "").strip()

    if not title:
        return jsonify({"error": "title is required"}), 400

    print(f"EXPLAIN: Generating explanation for '{title}' by '{author}'")

    def generate():
        try:
            response = requests.post(
                "http://localhost:11434/api/chat",
                json={
                    "model": "llama3.1:8b",
                    "stream": True,
                    "options": {"num_predict": 350},
                    "messages": [
                        {
                            "role": "system",
                            "content": (
                                "You are a warm, knowledgeable literary guide. "
                                "When given a book title and author, write a compelling 3–4 paragraph explanation covering: "
                                "1) What the book is fundamentally about (plot/premise, no spoilers), "
                                "2) The themes, tone, and writing style, "
                                "3) Who would love it and why it matters. "
                                "Write in an engaging, conversational tone — like recommending it to a friend. "
                                "Use plain text only, no markdown. Keep it under 220 words."
                            ),
                        },
                        {
                            "role": "user",
                            "content": f'Tell me about "{title}" by {author}.',
                        },
                    ],
                },
                stream=True,
                timeout=60,
            )

            for line in response.iter_lines():
                if not line:
                    continue
                try:
                    chunk = json.loads(line.decode("utf-8"))
                    text = chunk.get("message", {}).get("content", "")
                    if text:
                        safe = text.replace("\n", "{{NL}}")
                        yield f"data: {safe}\n\n"
                    if chunk.get("done"):
                        break
                except Exception:
                    continue

            print(f"EXPLAIN: Done streaming for '{title}'")

        except requests.exceptions.ConnectionError:
            print("EXPLAIN ERROR: Ollama not running")
            yield "data: ERROR: Ollama is not running. Start it with: ollama serve\n\n"
        except Exception as e:
            print(f"EXPLAIN ERROR: {type(e).__name__}: {e}")
            yield "data: ERROR: AI generation failed. Please try again.\n\n"

    return Response(
        stream_with_context(generate()),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        }
    )