from sqlalchemy import Column, String , Integer, ForeignKey, DateTime, JSON
from app.database import Base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

class User(Base):
    __tablename__ = "Users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True, unique=True, nullable=False)
    username = Column(String, unique=True, nullable=False, index=True)
    password = Column(String, nullable=False)
    sessions = relationship('ChatSession', back_populates='owner')

class ChatSession(Base):
    __tablename__ = "sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("Users.id"),nullable = False)

    messages = Column(JSON, default = list)
    recommendation = Column(String, nullable=True)
    feedback = Column(String, nullable = True)
    is_active = Column(String, default= "true")
    created_at = Column(DateTime(timezone = True), server_default=func.now())
    ended_at = Column(DateTime(timezone = True), nullable = True)

    owner = relationship(User, back_populates = "sessions")


