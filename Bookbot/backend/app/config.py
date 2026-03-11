import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

class Config:
    DEBUG = True

    DATASET_PATH = os.path.join(BASE_DIR, "..", "..", "dataset", "books_final_cleaned.csv")

    MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

    VECTOR_DB_PATH = os.path.join(BASE_DIR, "..", "storage", "vector_db")