from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    last_seen: Optional[datetime] = None

    class Config:
        from_attributes = True

class ChatBase(BaseModel):
    name: str
    is_group_chat: bool = False

class ChatCreate(ChatBase):
    user_ids: List[int]

class ChatResponse(ChatBase):
    id: int
    created_at: datetime
    users: List[UserResponse]

    class Config:
        from_attributes = True

class MessageBase(BaseModel):
    content: str

class MessageCreate(MessageBase):
    chat_id: int

class MessageResponse(MessageBase):
    id: int
    created_at: datetime
    updated_at: datetime
    is_read: bool
    user_id: int
    chat_id: int
    user: UserResponse

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[int] = None
