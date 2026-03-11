from ..rag.pipeline import RAGPipeline


class ChatService:
    def __init__(self):
        self.rag = RAGPipeline()

    def process_query(self, user_query):
        if not user_query:
            return {"error": "Empty query"}

        result = self.rag.query(user_query)

        return result