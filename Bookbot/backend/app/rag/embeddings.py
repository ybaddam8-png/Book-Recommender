from sentence_transformers import SentenceTransformer


class EmbeddingGenerator:
    def __init__(self):
        self.model = SentenceTransformer("all-MiniLM-L6-v2")

    def generate(self, texts):
        return self.model.encode(texts, show_progress_bar=True)
