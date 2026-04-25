from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import hash_password
from app.database import get_db

router = APIRouter(prefix="/users", tags=["users"])


@router.post(
    "/register",
    response_model=schemas.UserOut,
    status_code=status.HTTP_201_CREATED,
)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)) -> models.User:
    if db.query(models.User).filter(models.User.username == user_in.username).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already taken",
        )
    user = models.User(
        username=user_in.username,
        hashed_password=hash_password(user_in.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
