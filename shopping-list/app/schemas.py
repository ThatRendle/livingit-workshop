from pydantic import BaseModel


class UserCreate(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    id: int
    username: str

    model_config = {"from_attributes": True}


class ItemBase(BaseModel):
    name: str
    quantity: float | None = None
    unit: str | None = None
    notes: str | None = None


class ItemCreate(ItemBase):
    pass


class ItemUpdate(BaseModel):
    name: str | None = None
    quantity: float | None = None
    unit: str | None = None
    notes: str | None = None
    checked: bool | None = None


class ItemOut(ItemBase):
    id: int
    checked: bool

    model_config = {"from_attributes": True}
