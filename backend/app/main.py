from http.client import HTTPException
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi.security import OAuth2PasswordRequestForm
from app.database import engine,Base, get_db
from app import models, schemas, auth
from app.chat import router as chat_router
from fastapi.middleware.cors import CORSMiddleware

Base.metadata.create_all(bind = engine)
app = FastAPI(title = "AI Psychiatrist", description = "An AI- powered psychiatrist application")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  
    allow_credentials=True,
    allow_methods=["*"],   
    allow_headers=["*"],   
)

app.include_router(chat_router)

@app.get('/')
def read_root():
    return{"message": "AI Psychiatrist backend is running!"}

@app.post("/register", response_model = schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    hashed_password = auth.hash_password(user.password)
    new_user = models.User(
        email= user.email,
        username = user.username,
        password = hashed_password
    )
    db.add(new_user)
    try:
        db.commit()
        db.refresh(new_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Email is already registered")
    return new_user

@app.post('/login')
def login(form_login: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_login.username).first()
    if not user or not auth.verify_password(form_login.password, user.password):
        raise HTTPException(status_code = 401, detail= "Invalid credentials")
    access_token = auth.create_access_token({"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}