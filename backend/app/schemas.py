from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password : str
    username : str

class UserResponse(BaseModel):
    id : int
    email : str
    username : str
    
    class Config:
        from_attributes = True

class Message(BaseModel):
    role: str
    content: str

class MessageCreate(BaseModel):
    text : str

class SessionResponse(BaseModel):
    id: int
    messages : List[Message]
    recommendation : Optional[str] =  None
    feedback : Optional[str] = None
    is_active: str
    created_at : datetime

    class Config:
        from_attributes = True

class FeedbackCreate(BaseModel):
    feedback : str

