from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from typing import Dict, Set
import json
import httpx
from app.core.clerk import clerk
from clerk_backend_api.security import AuthenticateRequestOptions
from app.core.config import settings

router = APIRouter(prefix="/api/ws", tags=["websockets"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.org_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str, org_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        
        if org_id not in self.org_connections:
            self.org_connections[org_id] = set()
        self.org_connections[org_id].add(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str, org_id: str):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                
        if org_id in self.org_connections:
            self.org_connections[org_id].discard(websocket)
            if not self.org_connections[org_id]:
                del self.org_connections[org_id]

    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            for connection in list(self.active_connections[user_id]):
                try:
                    await connection.send_text(json.dumps(message))
                except Exception:
                    self.active_connections[user_id].discard(connection)

    async def broadcast_to_org(self, message: dict, org_id: str, exclude_user_id: str = None):
        if org_id in self.org_connections:
            connections = list(self.org_connections[org_id])
            for connection in connections:
                try:
                    await connection.send_text(json.dumps(message))
                except Exception:
                    self.org_connections[org_id].discard(connection)

manager = ConnectionManager()

@router.websocket("")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(...)):
    httpx_request = httpx.Request(
        method="GET",
        url="http://localhost/api/ws",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    try:
        request_state = clerk.authenticate_request(
            httpx_request,
            AuthenticateRequestOptions(authorized_parties=[settings.FRONTEND_URL])
        )
        
        if not request_state.is_signed_in:
            await websocket.close(code=1008)
            return
            
        claims = request_state.payload
        user_id = claims.get("sub")
        org_id = claims.get("org_id") or claims.get("o", {}).get("id")
        
        if not user_id or not org_id:
            await websocket.close(code=1008)
            return
            
        await manager.connect(websocket, user_id, org_id)
        
        try:
            while True:
                data = await websocket.receive_text()
        except WebSocketDisconnect:
            manager.disconnect(websocket, user_id, org_id)
            
    except Exception as e:
        print(f"WebSocket auth error: {e}")
        await websocket.close(code=1008)
