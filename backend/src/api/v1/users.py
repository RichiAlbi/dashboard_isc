from fastapi import APIRouter
from src.schemas.user import UserRead

router = APIRouter(prefix="/v1/users", tags=["users"])

# Mock-Daten
mock_users = [
    UserRead(userID=1, mode="dark", columnAmount=3, weather=True, systemStartup=False),
    UserRead(userID=2, mode="dark", columnAmount=5, weather=False, systemStartup=True),
    UserRead(userID=3, mode="dark", columnAmount=7, weather=True, systemStartup=True),
]

@router.get("/", response_model=list[UserRead])
def list_users():
    return mock_users

@router.get("/{user_id}", response_model=UserRead)
def get_user(user_id: int):
    for user in mock_users:
        if user.userID == user_id:
            return user
    return {"error": "User not found"}
