from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from datetime import datetime

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.llm import get_ai_response

router = APIRouter()


@router.post("/session/start", response_model=schemas.SessionResponse)
def start_session(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    new_session = models.ChatSession(
        user_id=current_user.id,
        messages=[],
        is_active="true"
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session


@router.post("/session/{session_id}/chat", response_model=schemas.SessionResponse)
def chat(
    session_id: int,
    message: schemas.MessageCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    session = db.query(models.ChatSession).filter(
        models.ChatSession.id == session_id,
        models.ChatSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.is_active != "true":
        raise HTTPException(status_code=400, detail="Session has already ended")

    # User ka message list mein add karo
    session.messages.append({"role": "user", "content": message.text})

    # LLM ke liye format banao (role name "content" hi rakhna hai, LLM API isi ki expect karti hai)
    llm_history = [{"role": m["role"], "content": m["content"]} for m in session.messages]

    ai_reply = get_ai_response(llm_history)

    # AI ka reply bhi list mein add karo
    session.messages.append({"role": "assistant", "content": ai_reply})

    # IMPORTANT: JSON column ko update karne ke liye yeh line zaroori hai (neeche explain hai)
    flag_modified(session, "messages")

    db.commit()
    db.refresh(session)
    return session


@router.post("/session/{session_id}/end", response_model=schemas.SessionResponse)
def end_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    session = db.query(models.ChatSession).filter(
        models.ChatSession.id == session_id,
        models.ChatSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # AI se ek final summary/recommendation banwao
    llm_history = [{"role": m["role"], "content": m["content"]} for m in session.messages]
    llm_history.append({
        "role": "user",
        "content": "Based on our entire conversation above, please give me a short, "
            "supportive recommendation (general coping tips, no diagnosis, no medicine). "
            "IMPORTANT: Reply in the SAME language I used throughout our conversation above, "
            "not the language of this specific instruction."
    })

    recommendation = get_ai_response(llm_history)

    session.recommendation = recommendation
    session.is_active = "false"
    session.ended_at = datetime.utcnow()

    db.commit()
    db.refresh(session)
    return session

@router.post("/session/{session_id}/feedback", response_model=schemas.SessionResponse)
def submit_feedback(
    session_id: int,
    feedback_data: schemas.FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    session = db.query(models.ChatSession).filter(
        models.ChatSession.id == session_id,
        models.ChatSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.is_active == "true":
        raise HTTPException(status_code=400, detail="Please end the session before submitting feedback")

    valid_options = ["satisfied", "moderate", "not_satisfied"]
    if feedback_data.feedback not in valid_options:
        raise HTTPException(
            status_code=400,
            detail=f"Feedback must be one of: {valid_options}"
        )

    session.feedback = feedback_data.feedback
    db.commit()
    db.refresh(session)
    return session

@router.get("/sessions", response_model=list[schemas.SessionResponse])
def get_my_sessions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    sessions = db.query(models.ChatSession).filter(
        models.ChatSession.user_id == current_user.id
    ).order_by(models.ChatSession.created_at.desc()).all()
    return sessions