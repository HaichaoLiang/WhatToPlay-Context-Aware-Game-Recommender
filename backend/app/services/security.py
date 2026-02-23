from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

# Argon2id is default and recommended by argon2-cffi
_ph = PasswordHasher(
    time_cost=2,        # increase later if you want
    memory_cost=102400, # 100 MB (dev ok; can lower if needed)
    parallelism=8,
    hash_len=32,
    salt_len=16,
)

def hash_password(password: str) -> str:
    # No 72-byte limitation like bcrypt
    return _ph.hash(password)

def verify_password(password: str, password_hash: str) -> bool:
    try:
        return _ph.verify(password_hash, password)
    except VerifyMismatchError:
        return False
    except Exception:
        # covers invalid hash format etc.
        return False
