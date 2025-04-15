from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional

class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: str
    is_active: bool

    class Config:
        orm_mode = True

class ChatBase(BaseModel):
    name: str
    is_group_chat: bool = False

class ChatCreate(ChatBase):
    user_ids: List[int]

class ChatResponse(ChatBase):
    id: int
    created_at: str
    users: List[UserResponse]

    class Config:
        orm_mode = True

class MessageBase(BaseModel):
    content: str

class MessageCreate(MessageBase):
    chat_id: int

class MessageResponse(MessageBase):
    id: int
    created_at: str
    updated_at: str
    is_read: bool
    user_id: int
    chat_id: int
    user: UserResponse

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
