from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app import models
from app.database import get_db

security = HTTPBasic()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def get_current_user(
    credentials: HTTPBasicCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> models.User:
    user = (
        db.query(models.User)
        .filter(models.User.username == credentials.username)
        .first()
    )
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    return user
