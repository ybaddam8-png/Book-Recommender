import faiss
import numpy as np


class VectorStore:
    def __init__(self, dimension):
        self.index = faiss.IndexFlatL2(dimension)
        self.metadata = []

    def add_vectors(self, vectors, metadata):
        self.index.add(np.array(vectors))
        self.metadata.extend(metadata)

    def search(self, query_vector, k=5):
        distances, indices = self.index.search(np.array([query_vector]), k)

        results = []
        for idx in indices[0]:
            results.append(self.metadata[idx])

        return results
