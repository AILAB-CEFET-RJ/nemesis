from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import text

from routes.auth_utils import hash_password
from routes.db import engine

router = APIRouter()


class CreateUserRequest(BaseModel):
    username: str
    password: str
    roles: list[str] = []


class UpdateUserRequest(BaseModel):
    is_active: bool | None = None
    password: str | None = None


class UpdateUserRolesRequest(BaseModel):
    roles: list[str]


@router.get("/admin/users")
def list_users():
    query = text(
        """
        SELECT
            u.id,
            u.username,
            u.is_active,
            u.created_at,
            COALESCE(array_agg(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL), '{}') AS roles,
            COALESCE(array_agg(DISTINCT p.code) FILTER (WHERE p.code IS NOT NULL), '{}') AS permissions
        FROM users u
        LEFT JOIN user_roles ur ON ur.user_id = u.id
        LEFT JOIN roles r ON r.id = ur.role_id
        LEFT JOIN role_permissions rp ON rp.role_id = r.id
        LEFT JOIN permissions p ON p.id = rp.permission_id
        GROUP BY u.id, u.username, u.is_active, u.created_at
        ORDER BY u.username;
        """
    )
    with engine.connect() as conn:
        rows = conn.execute(query).mappings().all()
    return [dict(row) for row in rows]


@router.get("/admin/roles")
def list_roles():
    query = text("SELECT id, name FROM roles ORDER BY name;")
    with engine.connect() as conn:
        rows = conn.execute(query).mappings().all()
    return [dict(row) for row in rows]


@router.get("/admin/permissions")
def list_permissions():
    query = text("SELECT id, code FROM permissions ORDER BY code;")
    with engine.connect() as conn:
        rows = conn.execute(query).mappings().all()
    return [dict(row) for row in rows]


@router.post("/admin/users")
def create_user(payload: CreateUserRequest):
    if not payload.username.strip():
        raise HTTPException(status_code=400, detail="username inválido.")

    password_hash = hash_password(payload.password)
    with engine.begin() as conn:
        existing = conn.execute(
            text("SELECT 1 FROM users WHERE username = :username"),
            {"username": payload.username},
        ).first()
        if existing:
            raise HTTPException(status_code=409, detail="Usuário já existe.")

        user_id = conn.execute(
            text(
                """
                INSERT INTO users (username, password_hash)
                VALUES (:username, :password_hash)
                RETURNING id;
                """
            ),
            {"username": payload.username, "password_hash": password_hash},
        ).scalar_one()

        if payload.roles:
            conn.execute(
                text(
                    """
                    INSERT INTO user_roles (user_id, role_id)
                    SELECT :user_id, r.id
                    FROM roles r
                    WHERE r.name = ANY(:roles);
                    """
                ),
                {"user_id": user_id, "roles": payload.roles},
            )

    return {"id": user_id, "username": payload.username}


@router.put("/admin/users/{user_id}")
def update_user(user_id: int, payload: UpdateUserRequest):
    if payload.is_active is None and payload.password is None:
        raise HTTPException(status_code=400, detail="Nenhuma alteração informada.")

    updates = []
    params: dict = {"user_id": user_id}
    if payload.is_active is not None:
        updates.append("is_active = :is_active")
        params["is_active"] = payload.is_active
    if payload.password:
        updates.append("password_hash = :password_hash")
        params["password_hash"] = hash_password(payload.password)

    with engine.begin() as conn:
        result = conn.execute(
            text(f"UPDATE users SET {', '.join(updates)} WHERE id = :user_id"),
            params,
        )
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    return {"status": "ok"}


@router.put("/admin/users/{user_id}/roles")
def update_user_roles(user_id: int, payload: UpdateUserRolesRequest):
    with engine.begin() as conn:
        user_exists = conn.execute(
            text("SELECT 1 FROM users WHERE id = :user_id"),
            {"user_id": user_id},
        ).first()
        if not user_exists:
            raise HTTPException(status_code=404, detail="Usuário não encontrado.")

        conn.execute(
            text("DELETE FROM user_roles WHERE user_id = :user_id"),
            {"user_id": user_id},
        )

        if payload.roles:
            conn.execute(
                text(
                    """
                    INSERT INTO user_roles (user_id, role_id)
                    SELECT :user_id, r.id
                    FROM roles r
                    WHERE r.name = ANY(:roles);
                    """
                ),
                {"user_id": user_id, "roles": payload.roles},
            )

    return {"status": "ok"}
