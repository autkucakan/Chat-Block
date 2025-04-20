from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.orm import Session
from typing import Dict, List
from datetime import datetime, timezone
import json

from ..database import get_db
from .oauth2 import get_current_user
from .utils import status_connections, chat_connections
from .messages import create_message
from ..schemas import MessageBase
from ..models import UserStatus

router = APIRouter()

async def get_chat_handler(chat_id, db, current_user):
    # Import inside the function to avoid circular imports
    from .chats import get_chat
    return await get_chat(chat_id=chat_id, db=db, current_user=current_user)

@router.websocket("/chat/{chat_id}")
async def ws_chat_endpoint(
    websocket: WebSocket,
    chat_id: int,
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    user = await get_current_user(token, db)
    await get_chat_handler(chat_id=chat_id, db=db, current_user=user)
    await websocket.accept()
    chat_connections.setdefault(chat_id, []).append(websocket)
    try:
        while True:
            text = await websocket.receive_text()
            # Import here to avoid circular imports
            msg_in = MessageBase(content=text)
            new_msg = create_message(
                chat_id=chat_id,
                message=msg_in,
                db=db,
                current_user=user
            )
            payload = {
                "id": new_msg.id,
                "content": new_msg.content,
                "user_id": new_msg.user_id,
                "chat_id": new_msg.chat_id,
                "created_at": new_msg.created_at.isoformat(),
                "is_read": new_msg.is_read,
            }
            # hatteki herkese gitmesi için
            for conn in chat_connections.get(chat_id, []):
                await conn.send_json(payload)
    except WebSocketDisconnect:
        # temizle
        chat_connections[chat_id].remove(websocket)
        if not chat_connections[chat_id]:
            del chat_connections[chat_id]

@router.websocket("/status")
async def ws_status_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    user = await get_current_user(token, db)
    await websocket.accept()
    
    # Store connection with user ID mapping
    status_connections[websocket] = user.id
    
    user.status = UserStatus.ONLINE
    user.last_seen = datetime.now(timezone.utc)
    db.commit()
    
    # Broadcast status update
    update_msg = {"user_id": user.id, "status": user.status.value, "last_seen": user.last_seen.isoformat()}
    for conn in status_connections:
        await conn.send_json(update_msg)
    
    try:
        while True:
            text = await websocket.receive_text()
            try:
                data = json.loads(text)
                new_status = data.get("status")
                if new_status not in [s.value for s in UserStatus]:
                    await websocket.send_json({"error": "invalid status"})
                    continue
                user.status = new_status
                user.last_seen = datetime.now(timezone.utc)
                db.commit()
                update_msg = {"user_id": user.id, "status": user.status, "last_seen": user.last_seen.isoformat()}
                for conn in status_connections:
                    await conn.send_json(update_msg)
            except json.JSONDecodeError:
                await websocket.send_json({"error": "invalid format"})
    except WebSocketDisconnect:
        # Clean up by removing from the dictionary
        if websocket in status_connections:
            del status_connections[websocket]
        
        user.status = UserStatus.OFFLINE
        user.last_seen = datetime.now(timezone.utc)
        db.commit()
        
        update_msg = {"user_id": user.id, "status": user.status.value, "last_seen": user.last_seen.isoformat()}
        for conn in status_connections:
            await conn.send_json(update_msg) 