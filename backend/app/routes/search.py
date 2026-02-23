from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from app import db
from app.models_catalog import GameCatalog
from app.services.tfidf_index import load_index, tokenize

search_bp = Blueprint("search", __name__)

# lazy load index once per process
_INDEX = None

def get_index():
    global _INDEX
    if _INDEX is None:
        _INDEX = load_index()
    return _INDEX

@search_bp.post("")
@jwt_required()
def search():
    payload = request.get_json(silent=True) or {}
    query = (payload.get("query") or "").strip()
    topk = int(payload.get("topk") or 10)

    if not query:
        return jsonify({"error": "missing_query"}), 400
    topk = max(1, min(topk, 50))

    idx = get_index()
    hits = idx.search(query, topk=topk)

    # map doc_id -> appid
    appids = [idx.doc_appids[doc_id] for doc_id, _, _ in hits]
    if not appids:
        return jsonify({"query": query, "results": []}), 200

    rows = db.session.query(GameCatalog).filter(GameCatalog.appid.in_(appids)).all()
    by_id = {r.appid: r for r in rows}

    # build why terms (convert term_id -> actual term)
    # reverse vocab (term_id -> term)
    inv_vocab = {tid: term for term, tid in idx.vocab.items()}

    results = []
    for doc_id, score, why in hits:
        appid = idx.doc_appids[doc_id]
        g = by_id.get(appid)
        if not g:
            continue

        why_terms = []
        for tid_str, contrib in why.items():
            tid = int(tid_str)
            term = inv_vocab.get(tid)
            if term:
                why_terms.append({"term": term, "contrib": contrib})
        why_terms.sort(key=lambda x: x["contrib"], reverse=True)

        results.append({
            "appid": appid,
            "name": g.name,
            "header_image": g.header_image,
            "price": g.price,
            "genres": g.genres,
            "tags": g.tags,
            "score": score,
            "why": why_terms[:3]
        })

    return jsonify({
        "query": query,
        "topk": topk,
        "results": results,
        "query_tokens": tokenize(query),
    }), 200
