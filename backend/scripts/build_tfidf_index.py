import os
import sys
import argparse

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, BASE_DIR)

from app import create_app
from app import db
from app.models_catalog import GameCatalog
from app.services.tfidf_index import build_index_from_documents, save_index


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=None, help="limit number of docs (for quick test)")
    ap.add_argument("--path", type=str, default=None, help="output index path (optional)")
    args = ap.parse_args()

    app = create_app()
    with app.app_context():
        q = db.session.query(GameCatalog.appid, GameCatalog.document).filter(GameCatalog.document.isnot(None))
        if args.limit:
            q = q.limit(args.limit)
        rows = q.all()

        if not rows:
            print("No documents found. Make sure you imported catalog and document field is set.")
            return

        appids = [int(r[0]) for r in rows]
        docs = [r[1] or "" for r in rows]

        print(f"Building TF-IDF index for {len(docs)} games...")
        index = build_index_from_documents(docs, appids)
        out_path = save_index(index, args.path)
        print(f"Saved index to: {out_path}")
        print(f"Vocab size: {len(index.vocab)}")


if __name__ == "__main__":
    main()
