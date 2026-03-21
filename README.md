# The Librarian 📚

An intelligent book discovery and recommendation system powered by semantic search and local AI. Ask about genres, moods, authors, or "books like…" and get rich, personalised recommendations with AI-generated explanations — all running locally with no external API costs.


## Features

- **Semantic book search** — understands natural language queries like "cozy mystery set in winter" using FAISS vector similarity
- **AI-powered explanations** — click any book to get a streaming explanation of what it's about, its themes, and who would love it — powered by Llama 3.1 running locally via Ollama
- **Book detail overlay** — expand any result to see a full-page view with large cover art, metadata, description, and AI explanation
- **Save to library** — bookmark favourite books with a dedicated Saved tab, persisted in the browser across sessions
- **Chat history archive** — every query is saved, searchable, and clickable to re-run; slides in from the left sidebar
- **Cover art** — automatically fetched from the Open Library API using multiple strategies (title + author, title only, ISBN) with a generative colour fallback
- **Warm dark editorial UI** — Newsreader serif headings, Manrope body text, amber accent palette, ambient glow background

---

## Tech stack

### Backend

| Layer | Technology |
|---|---|
| Language | Python 3.7+ |
| Web framework | Flask + Flask-CORS |
| Semantic search | Sentence-Transformers (`all-MiniLM-L6-v2`) |
| Vector store | FAISS |
| Data | Pandas + NumPy |
| AI explanations | Ollama (local) running Llama 3.1 8B |
| Streaming | Flask `stream_with_context` + Server-Sent Events (SSE) |

### Frontend

| Layer | Technology |
|---|---|
| Structure | HTML5 |
| Styling | Custom CSS (CSS variables, no framework) |
| Logic | Vanilla JavaScript (ES2020) |
| Fonts | Newsreader + Manrope (Google Fonts) |
| Icons | Material Symbols Outlined |
| Cover art | Open Library Covers API |
| Persistence | localStorage (history + saved books) |

---

## Project structure

```
Bookbot/
├── backend/
│   ├── app/
│   │   ├── __init__.py          # Flask app factory
│   │   ├── config.py            # App configuration
│   │   ├── routes.py            # API endpoints (/chat, /explain)
│   │   ├── data/
│   │   │   ├── __init__.py
│   │   │   └── loader.py        # CSV data loading utilities
│   │   ├── rag/
│   │   │   ├── __init__.py
│   │   │   ├── embeddings.py    # Sentence-Transformer text embeddings
│   │   │   ├── pipeline.py      # RAG pipeline — query → FAISS → results
│   │   │   └── vector_store.py  # FAISS index management
│   │   └── services/
│   │       ├── __init__.py
│   │       └── chat_service.py  # Query classification + processing logic
│   ├── requirements.txt
│   └── run.py                   # Entry point
├── frontend/
│   ├── index.html               # App shell, overlays (book detail + archive)
│   ├── script.js                # All JS — chat, cards, overlay, archive, saved books
│   └── style.css                # Full design system (CSS variables, animations)
└── dataset/
    └── books_final_cleaned.csv  # Book database
```

---

## Prerequisites

- Python 3.7 or higher
- [Ollama](https://ollama.com) installed and running
- Llama 3.1 8B model pulled via Ollama

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/the-librarian.git
cd the-librarian
```

### 2. Create and activate a virtual environment

```bash
# macOS / Linux
python3 -m venv venv
source venv/bin/activate

# Windows (PowerShell)
python -m venv venv
venv\Scripts\activate
```

### 3. Install Python dependencies

```bash
pip install -r backend/requirements.txt
```

### 4. Pull the AI model

```bash
ollama pull llama3.1:8b
```

---

## Running the app

You need two terminals running simultaneously.

**Terminal 1 — start Ollama:**
```bash
ollama serve
```

> If you see `Error: listen tcp 127.0.0.1:11434: bind: Only one usage of each socket address`, Ollama is already running — skip this step.

**Terminal 2 — start Flask:**
```bash
cd backend
python run.py
```

Then open your browser at `http://127.0.0.1:5000`

---

## API endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Serves the frontend |
| `GET` | `/<path>` | Serves static frontend files |
| `POST` | `/chat` | Processes a query and returns book recommendations |
| `POST` | `/explain` | Streams an AI explanation for a given book via SSE |

### POST /chat

**Request:**
```json
{ "message": "books like Harry Potter" }
```

**Response (books):**
```json
{
  "type": "books",
  "response": [
    {
      "title": "The Name of the Wind",
      "author": "Patrick Rothfuss",
      "description": "...",
      "rating": 4.54,
      "year": 2007,
      "pages": 662
    }
  ]
}
```

**Response (text):**
```json
{
  "type": "text",
  "response": "Hello! Ask me about any book, author, or genre."
}
```

### POST /explain

**Request:**
```json
{ "title": "Dune", "author": "Frank Herbert" }
```

**Response:** Server-Sent Events stream of plain text chunks.

```
data: Dune is a sweeping science fiction epic...
data:  set on the desert planet Arrakis...
data: {{NL}}{{NL}}
data: At its core the novel explores...
```

> `{{NL}}` is a newline escape used to keep SSE `data:` lines intact. The frontend decodes these back to `\n` automatically.

---

## How it works

```
User query
    │
    ▼
ChatService.process_query()
    │
    ├── Greeting / small talk? ──► Return text response
    │
    └── Book query?
            │
            ▼
        Text embedding (Sentence-Transformers all-MiniLM-L6-v2)
            │
            ▼
        FAISS similarity search over book dataset
            │
            ▼
        Top-N results returned as JSON
            │
            ▼
        Frontend renders book cards
            │
            ├── Click card ──► Book detail overlay (cover, metadata, description)
            │
            └── Click "What's this about?"
                        │
                        ▼
                POST /explain → Ollama (Llama 3.1 8B) → SSE stream
                        │
                        ▼
                Explanation streams into overlay panel
```

---

## Frontend features

### Chat interface
- Auto-resizing textarea input
- `Enter` to send, `Shift+Enter` for new line
- Animated typing indicator (three amber dots)
- Suggestion chips on the welcome screen

### Book cards
- Click any card to open the full detail overlay
- Save button on each card — persisted to `localStorage`
- Book covers fetched from Open Library with three fallback strategies:
  1. Title + author combined search
  2. Title-only search
  3. ISBN lookup
- Coloured initials tile as final fallback (unique colour per title)

### Book detail overlay
- Large cover image on the left, full metadata panel on the right
- Save / unsave with one click — synced with the sidebar badge
- AI explanation streams in real time via Ollama
- Close with ✕ button, backdrop click, or `Escape`

### Archive panel (sidebar)
Accessible via the **Archive** or **Saved** buttons in the left sidebar.

**History tab**
- Every query logged with timestamp and result count
- Real-time search filter
- Click any item to re-run that query instantly
- Clear all history

**Saved tab**
- All saved books with covers, title, author, and star rating
- Real-time search filter
- Remove individual books with ✕
- Badge count shown on sidebar buttons

### Toast notifications
- Brief amber notification slides up from the bottom on save / unsave

---

## Changing the AI model

The explanation generator uses Ollama locally. To switch models, change the model name in `backend/app/routes.py`:

```python
"model": "llama3.1:8b",  # change to any model you have pulled
```

Any model available via `ollama list` will work. Recommended alternatives:

| Model | Size | Notes |
|---|---|---|
| `llama3.2` | 2B | Fastest, smallest |
| `mistral` | 7B | Good quality/speed balance |
| `phi3` | 3.8B | Very fast, surprisingly capable |
| `llama3.1:8b` | 8B | Default — best quality |

---

## Usage examples

| Query | What it does |
|---|---|
| `books like Harry Potter` | Finds semantically similar fantasy/adventure books |
| `dark mystery novels` | Genre-based semantic search |
| `books by Agatha Christie` | Author-filtered results |
| `something cozy to read in winter` | Mood-based natural language query |
| `science fiction with strong female leads` | Theme + character-based search |

---

## Configuration

No API keys or external services are required. The only dependency is having Ollama running locally with a compatible model pulled.

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Push and open a pull request

---

## License

MIT — see `LICENSE` for details.

---

## Acknowledgements

- [Sentence-Transformers](https://www.sbert.net/) for text embeddings
- [FAISS](https://github.com/facebookresearch/faiss) for vector similarity search
- [Ollama](https://ollama.com) for local LLM inference
- [Open Library](https://openlibrary.org) for book cover images
- [Google Fonts](https://fonts.google.com) for Newsreader and Manrope typefaces