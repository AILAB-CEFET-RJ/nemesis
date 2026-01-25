from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text

from routes.auth_utils import create_access_token, get_current_user, verify_password
from routes.db import engine

router = APIRouter()


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/auth/login")
def login(payload: LoginRequest):
    query = text(
        """
        SELECT id, username, password_hash, is_active
        FROM users
        WHERE username = :username
        """
    )
    with engine.connect() as conn:
        user = conn.execute(query, {"username": payload.username}).mappings().first()

    if not user or not user.get("is_active"):
        raise HTTPException(status_code=401, detail="Credenciais inválidas.")

    if not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciais inválidas.")

    token = create_access_token(user["username"])
    return {"access_token": token, "token_type": "bearer"}


@router.get("/auth/me")
def me(user: dict = Depends(get_current_user)):
    return {"id": user["id"], "username": user["username"], "permissions": user["permissions"]}
