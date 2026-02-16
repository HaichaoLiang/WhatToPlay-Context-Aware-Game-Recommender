import os
import re
import math
import pickle
from collections import Counter, defaultdict
from dataclasses import dataclass
from typing import Dict, List, Tuple, Optional

TOKEN_RE = re.compile(r"[a-z0-9]+")

STOPWORDS = {
    "the","a","an","and","or","to","of","in","on","for","with","as","is","are","be","by","at","from",
    "this","that","it","its","you","your","we","our","they","their","i","me","my",
}

def tokenize(text: str) -> List[str]:
    text = (text or "").lower()
    terms = TOKEN_RE.findall(text)
    return [t for t in terms if t not in STOPWORDS and len(t) >= 2]

@dataclass
class TfidfIndex:
    # vocab: term -> term_id
    vocab: Dict[str, int]
    # postings: term_id -> list of (doc_id, tfidf_weight)
    postings: Dict[int, List[Tuple[int, float]]]
    # doc_norms: doc_id -> L2 norm
    doc_norms: List[float]
    # doc_appids: doc_id -> appid
    doc_appids: List[int]
    # idf: term_id -> idf
    idf: List[float]

    def search(self, query: str, topk: int = 20) -> List[Tuple[int, float, Dict[str, float]]]:
        q_terms = tokenize(query)
        if not q_terms:
            return []

        q_tf = Counter(q_terms)
        # build query vector weights
        q_weights = {}
        for term, tf in q_tf.items():
            tid = self.vocab.get(term)
            if tid is None:
                continue
            # tf: 1 + log(tf)
            w = (1.0 + math.log(tf)) * self.idf[tid]
            q_weights[tid] = w

        if not q_weights:
            return []

        q_norm = math.sqrt(sum(w*w for w in q_weights.values())) or 1.0

        # accumulate scores: doc_id -> dot product
        scores = defaultdict(float)
        # for "why": keep top contributing query terms per doc
        contrib = defaultdict(lambda: defaultdict(float))

        for tid, qw in q_weights.items():
            plist = self.postings.get(tid, [])
            for doc_id, dw in plist:
                scores[doc_id] += qw * dw
                contrib[doc_id][tid] += qw * dw

        # cosine normalize
        results = []
        for doc_id, dot in scores.items():
            d_norm = self.doc_norms[doc_id] or 1.0
            score = dot / (q_norm * d_norm)
            results.append((doc_id, score))

        results.sort(key=lambda x: x[1], reverse=True)
        results = results[:topk]

        # build why terms (top 3 contributors)
        out = []
        for doc_id, score in results:
            term_scores = contrib[doc_id]
            top_terms = sorted(term_scores.items(), key=lambda x: x[1], reverse=True)[:3]
            why = {}
            for tid, cs in top_terms:
                # reverse lookup term
                # We'll store only the term weight contributions; frontend can show term names.
                why[str(tid)] = float(cs)
            out.append((doc_id, float(score), why))
        return out

def build_index_from_documents(
    documents: List[str],
    appids: List[int]
) -> TfidfIndex:
    assert len(documents) == len(appids)
    N = len(documents)

    vocab: Dict[str, int] = {}
    df = Counter()
    doc_term_counts: List[Counter] = []

    # 1) tokenize + build df
    for doc in documents:
        terms = tokenize(doc)
        c = Counter(terms)
        doc_term_counts.append(c)
        for term in c.keys():
            df[term] += 1

    # 2) build vocab
    for term, _ in df.most_common():
        vocab[term] = len(vocab)

    # 3) idf
    idf = [0.0] * len(vocab)
    for term, dfi in df.items():
        tid = vocab[term]
        idf[tid] = math.log((N + 1) / (dfi + 1)) + 1.0  # smooth

    # 4) build postings and doc norms
    postings: Dict[int, List[Tuple[int, float]]] = defaultdict(list)
    doc_norms = [0.0] * N

    for doc_id, c in enumerate(doc_term_counts):
        norm_sq = 0.0
        for term, tf in c.items():
            tid = vocab[term]
            w = (1.0 + math.log(tf)) * idf[tid]
            postings[tid].append((doc_id, float(w)))
            norm_sq += w * w
        doc_norms[doc_id] = math.sqrt(norm_sq) or 1.0

    return TfidfIndex(
        vocab=vocab,
        postings=dict(postings),
        doc_norms=doc_norms,
        doc_appids=appids,
        idf=idf,
    )

def default_index_path() -> str:
    # backend/app/services/ -> backend/data/index/tfidf.pkl
    base = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    return os.path.join(base, "data", "index", "tfidf.pkl")

def save_index(index: TfidfIndex, path: Optional[str] = None) -> str:
    path = path or default_index_path()
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        pickle.dump(index, f)
    return path

def load_index(path: Optional[str] = None) -> TfidfIndex:
    path = path or default_index_path()
    with open(path, "rb") as f:
        return pickle.load(f)
