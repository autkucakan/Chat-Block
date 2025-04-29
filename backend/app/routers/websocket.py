from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.orm import Session
from typing import Dict, List
from datetime import datetime, timezone
import json

from ..database import get_db
from .oauth2 import get_current_user
from .utils import chat_connections
from .messages import create_message
from ..schemas import MessageBase

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