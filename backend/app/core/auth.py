import httpx
from fastapi import Depends, HTTPException, Request, status
from clerk_backend_api.security import AuthenticateRequestOptions
from app.core.config import settings
from app.core.clerk import clerk


class AuthUser:
    def __init__(self, user_id: str, org_id: str, org_permissions: list):
        self.user_id = user_id
        self.org_id = org_id
        self.org_permissions = org_permissions

    def has_permission(self, permission: str) -> bool:
        return permission in self.org_permissions

    @property
    def can_view(self) -> bool:
        return True

    @property
    def can_create(self) -> bool:
        return self.has_permission("org:tasks:create") or self.has_permission("org:tasks:manage")

    @property
    def can_delete(self) -> bool:
        return self.has_permission("org:tasks:delete") or self.has_permission("org:tasks:manage")

    @property
    def can_edit(self) -> bool:
        return self.has_permission("org:tasks:edit") or self.has_permission("org:tasks:manage")


def convert_to_httpx_request(fastapi_request: Request) -> httpx.Request:
    return httpx.Request(
        method=fastapi_request.method,
        url=str(fastapi_request.url),
        headers=dict(fastapi_request.headers)
    )


async def get_current_user(request: Request) -> AuthUser:
    httpx_request = convert_to_httpx_request(request)

    request_state = clerk.authenticate_request(
        httpx_request,
        AuthenticateRequestOptions(authorized_parties=[settings.FRONTEND_URL])
    )

    if not request_state.is_signed_in:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
        )

    claims = request_state.payload
    user_id = claims.get("sub")
    org_id = claims.get("org_id")

    org_claims = claims.get("o", {})
    raw_permissions = org_claims.get("per", "")
    if isinstance(raw_permissions, str):
        org_permissions = [
            f"org:tasks:{permission.strip()}"
            for permission in raw_permissions.split(",")
            if permission.strip()
        ]
    elif isinstance(raw_permissions, list):
        org_permissions = [
            f"org:tasks:{permission.strip()}"
            for permission in raw_permissions
            if isinstance(permission, str) and permission.strip()
        ]
    else:
        org_permissions = []

    org_role = org_claims.get("rol") or org_claims.get("role") or claims.get("org_role")
    if org_role in {"org:admin", "org:editor"}:
        org_permissions.extend([
            "org:tasks:view",
            "org:tasks:create",
            "org:tasks:edit",
            "org:tasks:delete",
            "org:tasks:manage",
        ])

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
        )

    if not org_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No organization selected"
        )

    return AuthUser(user_id=user_id, org_id=org_id, org_permissions=org_permissions)


def require_view(user: AuthUser = Depends(get_current_user)) -> AuthUser:
    if not user.can_view:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="View permission required"
        )

    return user


def require_create(user: AuthUser = Depends(get_current_user)) -> AuthUser:
    if not user.can_create:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Create permission required"
        )

    return user


def require_delete(user: AuthUser = Depends(get_current_user)) -> AuthUser:
    if not user.can_delete:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Delete permission required"
        )

    return user


def require_edit(user: AuthUser = Depends(get_current_user)) -> AuthUser:
    if not user.can_edit:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Edit permission required"
        )

    return user
