from pydantic import BaseModel

class UserBase(BaseModel):
    userID: int
    mode: str
    columnAmount: int
    weather: bool
    systemStartup: bool

    class Config:
        from_attributes = True


class UserRead(UserBase):
    pass
