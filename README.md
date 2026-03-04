# BookBot AI 📚

An intelligent book discovery and recommendation system powered by AI. BookBot helps users find books based on their preferences, search by authors, and get personalized recommendations using semantic search and RAG (Retrieval-Augmented Generation) techniques.

## 🌟 Features

- **Intelligent Book Search**: Find books using natural language queries
- **Author Discovery**: Search for books by specific authors or learn about authors
- **Semantic Recommendations**: Get book suggestions based on meaning and context, not just keywords
- **Interactive Chat Interface**: User-friendly web interface for seamless interaction
- **Real-time Responses**: Fast and accurate book recommendations
- **Rich Book Information**: Display detailed information including ratings, page count, publication year, and descriptions

## 🛠️ Tech Stack

### Backend
- **Python 3.x**: Core programming language
- **Flask**: Web framework for the API server
- **Flask-CORS**: Cross-origin resource sharing support
- **Pandas**: Data manipulation and analysis
- **NumPy**: Numerical computing
- **Sentence-Transformers**: Text embeddings and semantic search
- **FAISS**: Facebook AI Similarity Search for efficient vector similarity
- **Scikit-learn**: Machine learning utilities

### Frontend
- **HTML5**: Structure and content
- **CSS3**: Styling with modern design
- **JavaScript (Vanilla)**: Interactive functionality
- **Google Fonts**: Typography (Inter and JetBrains Mono)

### Data
- **CSV Dataset**: Cleaned book database with metadata including:
  - Title and author information
  - Publisher and publication year
  - Page count and ratings
  - ISBN and review counts

## 📋 Dependencies

### Python Dependencies
Install the required Python packages using:

```bash
pip install -r Bookbot/backend/requirements.txt
```

### Prerequisites
- Python 3.7 or higher
- pip (Python package manager)
- Modern web browser

### Step 1: Set Up the Environment

1. Navigate to the project directory:
```bash
cd Bookbot
```

2. Create and activate a virtual environment (recommended):
```bash
# For Windows
python -m venv venv
venv\Scripts\activate

# For macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### Step 2: Install Dependencies

```bash
pip install -r backend/requirements.txt
```

### Step 3: Run the Application

Navigate to the backend directory and start the Flask server:

```bash
cd backend
python app.py
```

The server will start on `http://127.0.0.1:5000`

## 📁 Project Structure

```
Bookbot/
├── backend/
│   ├── app.py              # Flask application and API endpoints
│   ├── rag_pipeline.py     # RAG pipeline for semantic search
│   ├── data_loader.py      # Data loading utilities
│   ├── embeddings.py       # Text embedding functions
│   ├── vector_store.py     # Vector database operations
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── index.html          # Main web interface
│   ├── script.js           # Frontend JavaScript logic
│   └── style.css           # Styling and design
├── dataset/
│   └── books_final_cleaned.csv  # Book database
├── venv/                   # Virtual environment
└── package-lock.json       # Node.js lock file (if applicable)
```

## 💡 Usage Examples

### Basic Queries
- **Greeting**: "hi", "hello", "hey"
- **Author Search**: "books by J.K. Rowling", "tell me about Stephen King"
- **Genre Search**: "science fiction books", "fantasy novels"
- **Recommendations**: "books similar to Harry Potter", "adventure stories"

### Advanced Features
- **Semantic Search**: The system understands context and meaning
- **Author Information**: Get details about authors and their book counts
- **Rich Results**: Each recommendation includes ratings, page count, and publication details

## 🔧 How It Works

1. **Data Processing**: The system loads book data from the CSV dataset
2. **Text Embedding**: Book information is converted to vector embeddings using Sentence-Transformers
3. **Vector Storage**: Embeddings are stored in FAISS for efficient similarity search
4. **Query Processing**: User queries are processed and matched against the vector database
5. **Response Generation**: Results are formatted and presented through the web interface

## 🎯 API Endpoints

- `GET /`: Serves the main web interface
- `GET /<path:path>`: Serves static frontend files
- `POST /chat`: Processes chat messages and returns book recommendations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source. Please check the license file for more details.

## 📞 Support

For issues, questions, or contributions, please create an issue in the project repository.

---

**Happy Reading! 📖**
