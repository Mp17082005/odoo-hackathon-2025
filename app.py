from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from sqlalchemy import create_engine, Column, Integer, String, Text, ForeignKey, Boolean, DateTime, Table
from sqlalchemy.orm import sessionmaker, relationship, declarative_base, Session
from datetime import datetime, timedelta
import uuid
import os

# JWT Config
SECRET_KEY = "your-secret-key"  # Change this!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

# Database setup
DATABASE_URL = "mysql+mysqlconnector://root:Ganesh_Pandey16@127.0.0.1:3306/stackit"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Models
class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    email = Column(String(100), unique=True)
    hashed_password = Column(String(255))
    role = Column(String(20), default="user")  # "guest", "user", "admin"
    questions = relationship("Question", back_populates="user")
    answers = relationship("Answer", back_populates="user")

# Association table for many-to-many relationship between questions and tags
question_tags = Table(
    'question_tags', Base.metadata,
    Column('question_id', Integer, ForeignKey('questions.id'), primary_key=True),
    Column('tag_id', Integer, ForeignKey('tags.id'), primary_key=True)
)

class Tag(Base):
    __tablename__ = 'tags'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True)
    questions = relationship("Question", secondary=question_tags, back_populates="tags")

class Question(Base):
    __tablename__ = 'questions'

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255))
    description = Column(Text)
    user_id = Column(Integer, ForeignKey('users.id'))
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="questions")
    tags = relationship("Tag", secondary=question_tags, back_populates="questions")
    answers = relationship("Answer", back_populates="question")

class Answer(Base):
    __tablename__ = 'answers'

    id = Column(Integer, primary_key=True, index=True)
    description = Column(Text)
    user_id = Column(Integer, ForeignKey('users.id'))
    question_id = Column(Integer, ForeignKey('questions.id'))
    created_at = Column(DateTime, default=datetime.utcnow)
    is_accepted = Column(Boolean, default=False)
    user = relationship("User", back_populates="answers")
    question = relationship("Question", back_populates="answers")

class Vote(Base):
    __tablename__ = 'votes'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    answer_id = Column(Integer, ForeignKey('answers.id'))
    vote_type = Column(String(10))  # up or down

class Notification(Base):
    __tablename__ = 'notifications'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    message = Column(String(255))
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

# Pydantic Schemas
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class QuestionCreate(BaseModel):
    title: str
    description: str
    tags: List[str]

class AnswerCreate(BaseModel):
    description: str
    question_id: int

# FastAPI app
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files for image uploads
from fastapi.staticfiles import StaticFiles
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "static", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=os.path.join(os.path.dirname(__file__), "static")), name="static")



# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Password hashing utils
def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# JWT utils
def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def authenticate_user(db: Session, username: str, password: str):
    user = get_user_by_username(db, username)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username, role=payload.get("role"))
    except JWTError:
        raise credentials_exception
    user = get_user_by_username(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)):
    if current_user.role == "guest":
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def get_current_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current_user

@app.post("/upload-image")
def upload_image(file: UploadFile = File(...), current_user: User = Depends(get_current_active_user)):
    # Only allow image files
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed.")
    # Generate unique filename
    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    # Save file
    with open(file_path, "wb") as buffer:
        buffer.write(file.file.read())
    url = f"/static/uploads/{filename}"
    return {"url": url}

@app.post("/register", response_model=Token)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = get_user_by_username(db, user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = get_password_hash(user.password)
    new_user = User(username=user.username, email=user.email, hashed_password=hashed_password, role="user")
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    access_token = create_access_token(data={"sub": new_user.username, "role": new_user.role})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    access_token = create_access_token(data={"sub": user.username, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/questions")
def create_question(question: QuestionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    # Find or create tags
    tag_objs = []
    for tag_name in question.tags:
        tag = db.query(Tag).filter(Tag.name == tag_name).first()
        if not tag:
            tag = Tag(name=tag_name)
            db.add(tag)
            db.commit()
            db.refresh(tag)
        tag_objs.append(tag)
    db_question = Question(
        title=question.title,
        description=question.description,
        user_id=current_user.id,
        tags=tag_objs
    )
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    return db_question

@app.get("/tags", response_model=List[str])
def list_tags(db: Session = Depends(get_db)):
    tags = db.query(Tag).all()
    return [tag.name for tag in tags]

@app.post("/tags", response_model=str)
def create_tag(tag_name: str, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    tag = db.query(Tag).filter(Tag.name == tag_name).first()
    if tag:
        raise HTTPException(status_code=400, detail="Tag already exists")
    tag = Tag(name=tag_name)
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag.name

import re

@app.post("/answers")
def create_answer(answer: AnswerCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_answer = Answer(
        description=answer.description,
        question_id=answer.question_id,
        user_id=current_user.id
    )
    db.add(db_answer)
    db.commit()
    db.refresh(db_answer)
    # Notify question owner
    question = db.query(Question).filter(Question.id == answer.question_id).first()
    if question and question.user_id != current_user.id:
        notif = Notification(
            user_id=question.user_id,
            message=f"Your question was answered by {current_user.username}",
            is_read=False
        )
        db.add(notif)
    # Notify mentioned users
    mentioned = set(re.findall(r"@([\w\d_]+)", answer.description))
    for username in mentioned:
        mentioned_user = db.query(User).filter(User.username == username).first()
        if mentioned_user and mentioned_user.id != current_user.id:
            notif = Notification(
                user_id=mentioned_user.id,
                message=f"You were mentioned by {current_user.username}",
                is_read=False
            )
            db.add(notif)
    db.commit()
    return db_answer

@app.post("/votes/{answer_id}")
def vote_answer(answer_id: int, vote_type: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    # Prevent duplicate votes
    existing_vote = db.query(Vote).filter_by(user_id=current_user.id, answer_id=answer_id).first()
    if existing_vote:
        existing_vote.vote_type = vote_type
    else:
        db_vote = Vote(user_id=current_user.id, answer_id=answer_id, vote_type=vote_type)
        db.add(db_vote)
    db.commit()
    return {"message": "Vote recorded"}

@app.post("/accept")
def accept_answer(answer_id: int, db: Session = Depends(get_db)):
    answer = db.query(Answer).filter(Answer.id == answer_id).first()
    if not answer:
        raise HTTPException(status_code=404, detail="Answerx not found")
    answer.is_accepted = True
    db.commit()
    return {"status": "accepted"}

@app.get("/notifications")
def get_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    notifs = db.query(Notification).filter(Notification.user_id == current_user.id).order_by(Notification.created_at.desc()).all()
    return notifs

@app.post("/notifications/mark-read")
def mark_notifications_read(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db.query(Notification).filter(Notification.user_id == current_user.id, Notification.is_read == False).update({Notification.is_read: True})
    db.commit()
    return {"status": "all notifications marked as read"}
