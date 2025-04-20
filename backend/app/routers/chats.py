from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from sqlalchemy import and_

from ..database import get_db
from ..models import User, Chat, chat_users
from ..schemas import ChatCreate, ChatResponse
from .oauth2 import get_current_user
from .utils import status_connections

router = APIRouter()

@router.get("/", response_model=List[ChatResponse])
async def get_chats(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    chats = db.query(Chat).join(chat_users).filter(
        chat_users.c.user_id == current_user.id
    ).offset(skip).limit(limit).all()
    
    return chats

@router.post("/", response_model=ChatResponse, status_code=status.HTTP_201_CREATED)
async def create_chat(
    chat: ChatCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    for user_id in chat.user_ids:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with id {user_id} not found"
            )
    
    new_chat = Chat(
        name=chat.name,
        is_group_chat=chat.is_group_chat
    )
    db.add(new_chat)
    db.flush()

    db.execute(
        chat_users.insert().values(
            chat_id=new_chat.id,
            user_id=current_user.id
        )
    )
    
    for user_id in chat.user_ids:
        if user_id != current_user.id: # Avoid adding the same person twice
            db.execute(
                chat_users.insert().values(
                    chat_id=new_chat.id,
                    user_id=user_id
                )
            )
    
    db.commit()
    db.refresh(new_chat)

    # Send WebSocket notifications to all users involved
    try:
        # Get list of all user IDs that should receive the notification
        notification_user_ids = chat.user_ids + [current_user.id]
        
        # Find connections for these users
        for conn, user_id in status_connections.items():
            if user_id in notification_user_ids:
                try:
                    # Create serializable chat data
                    chat_data = {
                        "id": new_chat.id,
                        "name": new_chat.name,
                        "is_group_chat": new_chat.is_group_chat,
                        "created_at": new_chat.created_at.isoformat(),
                        "users": [{"id": u.id, "username": u.username} for u in new_chat.users]
                    }
                    
                    await conn.send_json({
                        "type": "chat",
                        "action": "chat.created",
                        "chat": chat_data
                    })
                except Exception as e:
                    print(f"Error sending chat creation notification: {e}")
    except Exception as e:
        print(f"Error in WebSocket notification process for chat creation: {e}")
    
    return new_chat

@router.get("/{chat_id}", response_model=ChatResponse)
async def get_chat(
    chat_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    #grupta var mi yok mu
    chat = db.query(Chat).join(chat_users).filter(
        and_(
            Chat.id == chat_id,
            chat_users.c.user_id == current_user.id
        )
    ).first()
    
    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found or you're not a member"
        )
    
    return chat

@router.put("/{chat_id}", response_model=ChatResponse)
async def update_chat(
    chat_id: int,
    chat_data: ChatCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    chat = db.query(Chat).join(chat_users).filter(
        and_(
            Chat.id == chat_id,
            chat_users.c.user_id == current_user.id
        )
    ).first()
    
    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found or you're not a member"
        )
    
    chat.name = chat_data.name
    chat.is_group_chat = chat_data.is_group_chat
    
    db.commit()
    db.refresh(chat)
    return chat

@router.delete("/{chat_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat(
    chat_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    #eleman var mı yok mu
    chat = db.query(Chat).join(chat_users).filter(
        and_(
            Chat.id == chat_id,
            chat_users.c.user_id == current_user.id
        )
    ).first()
    
    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found or you're not a member"
        )
    
    # Store the users before deleting
    chat_users_list = [user.id for user in chat.users]
    
    # Delete chat
    db.delete(chat)
    db.commit()

    # Send WebSocket notifications
    try:
        # Find connections for users in this chat
        for conn, user_id in status_connections.items():
            if user_id in chat_users_list:
                try:
                    await conn.send_json({
                        "type": "chat",
                        "action": "chat.deleted",
                        "chat_id": chat_id
                    })
                except Exception as e:
                    print(f"Error sending WebSocket notification: {e}")
    except Exception as e:
        print(f"Error in WebSocket notification process: {e}")
    
    return None

@router.post("/{chat_id}/members", response_model=ChatResponse)
async def add_members(
    chat_id: int,
    user_ids: List[int],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    chat = db.query(Chat).join(chat_users).filter(
        and_(
            Chat.id == chat_id,
            chat_users.c.user_id == current_user.id
        )
    ).first()
    
    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found or you're not a member"
        )
    
    for user_id in user_ids:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with id {user_id} not found"
            )
        
        existing_member = db.query(chat_users).filter(
            and_(
                chat_users.c.chat_id == chat_id,
                chat_users.c.user_id == user_id
            )
        ).first()
        
        if not existing_member:
            db.execute(
                chat_users.insert().values(
                    chat_id=chat_id,
                    user_id=user_id
                )
            )
    
    db.commit()
    db.refresh(chat)
    return chat

@router.delete("/{chat_id}/members/{user_id}", response_model=ChatResponse)
async def remove_member(
    chat_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    chat = db.query(Chat).join(chat_users).filter(
        and_(
            Chat.id == chat_id,
            chat_users.c.user_id == current_user.id
        )
    ).first()
    
    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found or you're not a member"
        )
    
    member = db.query(chat_users).filter(
        and_(
            chat_users.c.chat_id == chat_id,
            chat_users.c.user_id == user_id
        )
    ).first()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} is not a member of this chat"
        )
    
    db.execute(
        chat_users.delete().where(
            and_(
                chat_users.c.chat_id == chat_id,
                chat_users.c.user_id == user_id
            )
        )
    )
    
    db.commit()
    db.refresh(chat)
    return chat