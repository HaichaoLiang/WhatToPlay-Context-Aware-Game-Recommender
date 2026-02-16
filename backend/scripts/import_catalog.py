import os
import sys
import argparse
from typing import Optional

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, BASE_DIR)

from app import create_app, db  # noqa: E402
from app.models_catalog import GameCatalog  # noqa: E402


MAX_NAME_LEN = 512  # match model


def _s(x) -> Optional[str]:
    if x is None:
        return None
    s = str(x).strip()
    return s if s else None


def _i(x) -> Optional[int]:
    if x is None:
        return None
    try:
        return int(float(str(x).strip()))
    except Exception:
        return None


def _f(x) -> Optional[float]:
    if x is None:
        return None
    try:
        return float(str(x).strip())
    except Exception:
        return None


def _b(x) -> Optional[bool]:
    if x is None:
        return None
    s = str(x).strip().lower()
    if s in ("true", "1", "yes", "y"):
        return True
    if s in ("false", "0", "no", "n"):
        return False
    return None


def build_document(name: str, categories: Optional[str], genres: Optional[str], tags: Optional[str], about: Optional[str]) -> str:
    parts = [name]
    if categories:
        parts.append(categories)
    if genres:
        parts.append(genres)
    if tags:
        parts.append(tags)
    if about:
        parts.append(about)
    return "\n".join(parts)


def looks_like_url(s: Optional[str]) -> bool:
    if not s:
        return False
    s = s.lower()
    return s.startswith("http://") or s.startswith("https://")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--path", required=True, help="Path to games.csv")
    ap.add_argument("--limit", type=int, default=None, help="Import first N rows for testing")
    ap.add_argument("--batch", type=int, default=2000, help="Commit batch size")
    ap.add_argument("--skip_bad_names", action="store_true", help="Skip rows where name is too long")
    args = ap.parse_args()

    import pandas as pd

    app = create_app()
    with app.app_context():
        # IMPORTANT: use C engine (default) + explicit CSV quoting rules
        df = pd.read_csv(
            args.path,
            index_col=False,
            dtype=str,
            keep_default_na=False,
            na_filter=False,
            on_bad_lines="skip",
            quotechar='"',
            escapechar="\\",
            doublequote=True,
            encoding="utf-8",
            low_memory=False,
        )

        if args.limit:
            df = df.head(args.limit)

        print(f"Loaded rows: {len(df)}")
        print("Columns:", list(df.columns))

        inserted = 0
        updated = 0
        skipped = 0

        with db.session.no_autoflush:
            for _, row in df.iterrows():
                appid = _i(row.get("AppID"))
                name = _s(row.get("Name"))

                if not appid or not name:
                    skipped += 1
                    continue

                # Guard: if parsing is misaligned, name can become huge => skip to avoid polluting DB/index
                if len(name) > MAX_NAME_LEN:
                    if args.skip_bad_names:
                        skipped += 1
                        continue
                    name = name[:MAX_NAME_LEN]

                release_date = _s(row.get("Release date"))
                price = _f(row.get("Price"))

                about = _s(row.get("About the game"))
                supported_languages = _s(row.get("Supported languages"))
                full_audio_languages = _s(row.get("Full audio languages"))

                developers = _s(row.get("Developers"))
                publishers = _s(row.get("Publishers"))

                categories = _s(row.get("Categories"))
                genres = _s(row.get("Genres"))
                tags = _s(row.get("Tags"))

                header_image = _s(row.get("Header image"))
                website = _s(row.get("Website"))

                # extra sanity: if website accidentally contains steamstatic header image URL and header_image empty
                if not header_image and looks_like_url(website) and "steamstatic.com" in website and "/header." in website:
                    header_image, website = website, header_image

                windows = _b(row.get("Windows"))
                mac = _b(row.get("Mac"))
                linux = _b(row.get("Linux"))

                metacritic_score = _i(row.get("Metacritic score"))
                positive = _i(row.get("Positive"))
                negative = _i(row.get("Negative"))

                avg_session_minutes = _i(row.get("Average session minutes") or row.get("Avg Session Minutes"))
                multiplayer_mode = _s(row.get("Multiplayer mode") or row.get("Multiplayer"))
                difficulty = _s(row.get("Difficulty"))

                document = build_document(name, categories, genres, tags, about)

                existing = db.session.get(GameCatalog, appid)
                if existing:
                    existing.name = name
                    existing.release_date = release_date
                    existing.price = price
                    existing.about = about
                    existing.supported_languages = supported_languages
                    existing.full_audio_languages = full_audio_languages
                    existing.developers = developers
                    existing.publishers = publishers
                    existing.categories = categories
                    existing.genres = genres
                    existing.tags = tags
                    existing.header_image = header_image
                    existing.website = website
                    existing.windows = windows
                    existing.mac = mac
                    existing.linux = linux
                    existing.metacritic_score = metacritic_score
                    existing.positive = positive
                    existing.negative = negative
                    existing.avg_session_minutes = avg_session_minutes
                    existing.multiplayer_mode = multiplayer_mode
                    existing.difficulty = difficulty
                    existing.document = document
                    updated += 1
                else:
                    db.session.add(GameCatalog(
                        appid=appid,
                        name=name,
                        release_date=release_date,
                        price=price,
                        about=about,
                        supported_languages=supported_languages,
                        full_audio_languages=full_audio_languages,
                        developers=developers,
                        publishers=publishers,
                        categories=categories,
                        genres=genres,
                        tags=tags,
                        header_image=header_image,
                        website=website,
                        windows=windows,
                        mac=mac,
                        linux=linux,
                        metacritic_score=metacritic_score,
                        positive=positive,
                        negative=negative,
                        avg_session_minutes=avg_session_minutes,
                        multiplayer_mode=multiplayer_mode,
                        difficulty=difficulty,
                        document=document,
                    ))
                    inserted += 1

                if (inserted + updated) % args.batch == 0:
                    db.session.commit()
                    print(f"Committed... inserted={inserted}, updated={updated}, skipped={skipped}")

        db.session.commit()
        print(f"Done. inserted={inserted}, updated={updated}, skipped={skipped}")


if __name__ == "__main__":
    main()
