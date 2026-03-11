import pandas as pd
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer


class RAGPipeline:

    def __init__(self):
        self.df = pd.read_csv("../dataset/books_final_cleaned.csv")

        self.df["combined"] = (
            self.df["title"].fillna("")
            + " "
            + self.df["primary_author"].fillna("")
            + " "
            + self.df["publisher"].fillna("")
        )

        self.embedder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

        embeddings = self.embedder.encode(
            self.df["combined"].tolist(), show_progress_bar=True
        )

        embeddings = np.array(embeddings).astype("float32")

        dimension = embeddings.shape[1]
        self.index = faiss.IndexFlatL2(dimension)
        self.index.add(embeddings)

    def query(self, user_query, top_k=5):
        query_lower = user_query.lower().strip()

        # Greeting
        if query_lower in ["hi", "hello", "hey", "hii"]:
            return {
                "type": "text",
                "response": "Hey 👋 I'm BookBot! Tell me what kind of books you like.",
            }

        # Tell me about author
        if "tell me about" in query_lower:
            author_name = query_lower.replace("tell me about", "").strip()

            filtered = self.df[
                self.df["primary_author"].str.lower().str.contains(author_name)
            ]

            if len(filtered) > 0:
                return {
                    "type": "text",
                    "response": f"{author_name.title()} has {len(filtered)} books in our database.",
                }
            else:
                return {
                    "type": "text",
                    "response": "I couldn't find that author in my database.",
                }

        # Books by author
        if "by" in query_lower:
            author_name = query_lower.split("by")[-1].strip()

            filtered = self.df[
                self.df["primary_author"].str.lower().str.contains(author_name)
            ]

            if len(filtered) > 0:
                formatted = self._format_books(filtered.head(top_k))
                return {"type": "books", "response": formatted}

        # Semantic fallback
        query_embedding = self.embedder.encode([user_query])
        query_embedding = np.array(query_embedding).astype("float32")
        scores, indices = self.index.search(query_embedding, top_k)

        results = []
        for idx in indices[0]:
            results.append(self.df.iloc[idx])

        formatted = self._format_books(pd.DataFrame(results))
        return {"type": "books", "response": formatted}

    def _format_books(self, books_df):
        """Format book recommendations with descriptions"""
        formatted_books = []
        for _, book in books_df.iterrows():
            description = f"By {book['primary_author']}. Published by {book['publisher']} in {int(book['publication_year'])}. "
            description += f"Rating: {book['weighted_rating']:.2f}/5 ({int(book['ratings_count'])} ratings). "
            description += f"{int(book['num_pages'])} pages."

            formatted_books.append(
                {
                    "title": str(book["title"]),
                    "author": str(book["primary_author"]),
                    "description": description,
                    "rating": float(book["weighted_rating"]),
                    "pages": int(book["num_pages"]),
                    "year": int(book["publication_year"]),
                    "ratings_count": int(book["ratings_count"]),
                }
            )
        return formatted_books
