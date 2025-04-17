from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import models, schemas, database
from ..routers import oauth2

router = APIRouter(
    prefix="/chats/{chat_id}/messages",
    tags=["Messages"]
)

# Get messages in a chat (with pagination)
@router.get("/", response_model=List[schemas.MessageResponse])
def get_messages(
    chat_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    # Check if chat exists and user is a member
    chat = db.query(models.Chat).filter(models.Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")
    
    if current_user.id not in [user.id for user in chat.users]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this chat")
    
    # Get messages with pagination
    messages = db.query(models.Message).filter(
        models.Message.chat_id == chat_id
    ).order_by(models.Message.created_at.desc()).offset(skip).limit(limit).all()
    
    return messages

# Send new message
@router.post("/", response_model=schemas.MessageResponse, status_code=status.HTTP_201_CREATED)
def create_message(
    chat_id: int,
    message: schemas.MessageBase,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    # Check if chat exists and user is a member
    chat = db.query(models.Chat).filter(models.Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")
    
    if current_user.id not in [user.id for user in chat.users]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to send messages to this chat")
    
    # Create new message
    new_message = models.Message(
        content=message.content,
        user_id=current_user.id,
        chat_id=chat_id,
        is_read=False
    )
    
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    
    return new_message

# Mark messages as read
@router.put("/read", status_code=status.HTTP_200_OK)
def mark_messages_as_read(
    chat_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    # Check if chat exists and user is a member
    chat = db.query(models.Chat).filter(models.Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")
    
    if current_user.id not in [user.id for user in chat.users]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this chat")
    
    # Mark all unread messages in the chat as read (except those sent by the current user)
    db.query(models.Message).filter(
        models.Message.chat_id == chat_id,
        models.Message.is_read == False,
        models.Message.user_id != current_user.id
    ).update({"is_read": True}, synchronize_session=False)
    
    db.commit()
    
    return {"message": "Messages marked as read"}

# Edit message
@router.put("/{message_id}", response_model=schemas.MessageResponse)
def update_message(
    chat_id: int,
    message_id: int,
    message: schemas.MessageBase,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    # Check if message exists
    message_query = db.query(models.Message).filter(
        models.Message.id == message_id,
        models.Message.chat_id == chat_id
    )
    
    existing_message = message_query.first()
    if not existing_message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    
    # Check if user is the author of the message
    if existing_message.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to edit this message")
    
    # Update message
    message_query.update({"content": message.content}, synchronize_session=False)
    db.commit()
    db.refresh(existing_message)
    
    return existing_message

# Delete message
@router.delete("/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_message(
    chat_id: int,
    message_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    # Check if message exists
    message_query = db.query(models.Message).filter(
        models.Message.id == message_id,
        models.Message.chat_id == chat_id
    )
    
    message = message_query.first()
    if not message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    
    # Check if user is the author of the message
    if message.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this message")
    
    # Delete message
    message_query.delete(synchronize_session=False)
    db.commit()
    
    return

# Get message read status
@router.get("/{message_id}/read-status", response_model=dict)
def get_message_read_status(
    chat_id: int,
    message_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    # Check if message exists
    message = db.query(models.Message).filter(
        models.Message.id == message_id,
        models.Message.chat_id == chat_id
    ).first()
    
    if not message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    
    # Check if user is a member of the chat
    chat = db.query(models.Chat).filter(models.Chat.id == chat_id).first()
    if current_user.id not in [user.id for user in chat.users]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this chat")
    
    return {"is_read": message.is_read}
