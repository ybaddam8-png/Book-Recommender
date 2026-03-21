import pandas as pd


class DataLoader:
    def __init__(self, path):
        self.path = path

    def load_data(self):
        df = pd.read_csv(self.path)

        # Create text column for embeddings
        df["combined_text"] = (
            df["title"].astype(str) + " by " + df["primary_author"].astype(str)
        )

        df = df.fillna("")
        return df.reset_index(drop=True)
