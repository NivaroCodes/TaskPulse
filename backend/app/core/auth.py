import httpx
from fastapi import Depends, HTTPException, Request, status
from clerk_backend_api.security import AuthenticateRequestOptions
from app.core.config import settings
from app.core.clerk import clerk


class AuthUser:
    def __init__(self, user_id: str, org_id: str, org_permissions: list, role: str | None = None):
        self.user_id = user_id
        self.org_id = org_id
        self.org_permissions = org_permissions
        self.role = role

    def has_permission(self, permission: str) -> bool:
        return permission in self.org_permissions

    @property
    def can_view(self) -> bool:
        return self.has_permission("org:tasks:view") or self.has_permission("org:tasks:manage")

    @property
    def can_create(self) -> bool:
        return self.has_permission("org:tasks:create") or self.has_permission("org:tasks:manage")

    @property
    def can_delete(self) -> bool:
        return self.has_permission("org:tasks:delete") or self.has_permission("org:tasks:manage")

    @property
    def can_edit(self) -> bool:
        return self.has_permission("org:tasks:edit") or self.has_permission("org:tasks:manage")

    @property
    def can_invite(self) -> bool:
        return self.has_permission("org:members:invite") or self.has_permission("org:members:manage")


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

    org_permissions = claims.get("permissions") or claims.get("org_permissions") or []
    
    if isinstance(org_permissions, str):
        org_permissions = [p.strip() for p in org_permissions.split(',') if p.strip()]
    
    org_permissions = [p if p.startswith("org:") else f"org:tasks:{p}" for p in org_permissions]

    org_role = claims.get("org_role") or claims.get("o", {}).get("rol")
    if org_role in ["admin", "org:admin"]:
        org_permissions.extend([
            "org:tasks:view", "org:tasks:create", "org:tasks:edit", "org:tasks:delete", "org:tasks:manage",
            "org:members:invite", "org:members:manage", "org:billing:manage"
        ])
    elif org_role in ["project_manager", "org:project_manager"]:
        org_permissions.extend([
            "org:tasks:view", "org:tasks:create", "org:tasks:edit", "org:tasks:delete", "org:tasks:manage",
            "org:members:invite"
        ])
    elif org_role in ["member", "org:member"]:
        org_permissions.extend([
            "org:tasks:view", "org:tasks:create", "org:tasks:edit"
        ])
    elif org_role in ["viewer", "org:viewer", "guest", "org:guest"]:
        org_permissions.extend([
            "org:tasks:view"
        ])
    
    org_permissions = list(set(org_permissions))

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
        )

    if not org_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No organization selected"
        )

    return AuthUser(user_id=user_id, org_id=org_id, org_permissions=org_permissions, role=org_role)


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


def require_invite(user: AuthUser = Depends(get_current_user)) -> AuthUser:
    if not user.can_invite:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invite members permission required"
        )
    return user