from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from sqlalchemy import and_

from ..database import get_db
from ..models import User, Chat, chat_users
from ..schemas import ChatCreate, ChatResponse, UserResponse
from .oauth2 import get_current_user

router = APIRouter()

@router.get("/", response_model=List[ChatResponse])
async def get_chats(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get list of user's chats/conversations with pagination
    """
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
    """
    Create new chat (group or direct message)
    """
    # Verify all users exist
    for user_id in chat.user_ids:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with id {user_id} not found"
            )
    
    # Create new chat
    new_chat = Chat(
        name=chat.name,
        is_group_chat=chat.is_group_chat
    )
    db.add(new_chat)
    db.flush()
    
    # Add current user to chat
    db.execute(
        chat_users.insert().values(
            chat_id=new_chat.id,
            user_id=current_user.id
        )
    )
    
    # Add other users to chat
    for user_id in chat.user_ids:
        if user_id != current_user.id:  # Avoid adding current user twice
            db.execute(
                chat_users.insert().values(
                    chat_id=new_chat.id,
                    user_id=user_id
                )
            )
    
    db.commit()
    db.refresh(new_chat)
    return new_chat

@router.get("/{chat_id}", response_model=ChatResponse)
async def get_chat(
    chat_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get chat details
    """
    # Check if chat exists and user is a member
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
    """
    Update chat details (rename, etc.)
    """
    # Check if chat exists and user is a member
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
    
    # Update chat details
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
    """
    Delete chat
    """
    # Check if chat exists and user is a member
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
    
    # Delete chat
    db.delete(chat)
    db.commit()
    return None

@router.post("/{chat_id}/members", response_model=ChatResponse)
async def add_members(
    chat_id: int,
    user_ids: List[int],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Add members to chat
    """
    # Check if chat exists and user is a member
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
    
    # Add new members
    for user_id in user_ids:
        # Check if user exists
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with id {user_id} not found"
            )
        
        # Check if user is already a member
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
    """
    Remove member from chat
    """
    # Check if chat exists and user is a member
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
    
    # Check if user to remove exists in the chat
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
    
    # Remove member
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