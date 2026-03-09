from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
from config import JWT_ALGORITHM, JWT_EXPIRE_MINUTES, JWT_SECRET

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    # Hash a plain-text password using bcrypt.
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Verify a plain password against a hashed password.
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(subject: str, expires_delta: timedelta | None = None) -> str:
    """
    Create a JWT access token.

    Args:
        subject: Typically the user ID (stored as 'sub' claim).
        expires_delta: Optional custom expiry. Defaults to JWT_EXPIRE_MINUTES.

    Returns:
        Encoded JWT string.
    """
    if expires_delta is None:
        expires_delta = timedelta(minutes=JWT_EXPIRE_MINUTES)

    now = datetime.utcnow()
    expire = now + expires_delta

    payload = {
        "sub": subject,
        "iat": now,
        "exp": expire,
    }

    return jwt.encode(
        payload,
        JWT_SECRET,
        algorithm=JWT_ALGORITHM,
    )

def decode_access_token(token: str) -> str | None:
    """
    Decode and validate a JWT token. Returns the subject (user ID) or None if invalid.

    Args:
        token: The JWT string.

    Returns:
        User ID from 'sub' claim, or None if token is invalid/expired.
    """
    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
        )
        return payload.get("sub")
    except jwt.PyJWTError:
        return None
