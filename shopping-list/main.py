from fastapi import FastAPI

from app.database import Base, engine
from app.routers import items, users

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Grocery Shopping List API")

app.include_router(users.router)
app.include_router(items.router)
