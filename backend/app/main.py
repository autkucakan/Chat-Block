from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.database import get_db
from sqlalchemy.orm import Session
from sqlalchemy.sql import text
from app.routers import auth, users, chats, messages
from app.routers.websocket import router as websocket_router
from .config import settings

app = FastAPI(
    title="Block Chat",
    description="Real-time chat application API",
    version="0.1.0"
)

#CORS: bir tür güvenlik mekanizması.
# Bir web sitesi farklı bir domain'den veri istediğinde, tarayıcı önce bir "preflight" isteği gönderir
# Bu istek sunucuya "Bu kaynağa erişmeme izin var mı?" diye sorar
# Sunucu CORS ayarlarına göre "evet" veya "hayır" cevabı verir
# İzin varsa, asıl istek gerçekleştirilir
# powered by chatgpt

origins = [
    "http://localhost",
    "http://127.0.0.1",
    "http://217.18.210.30:3000",
    "http://172.16.12.215:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # Add OPTIONS
    allow_headers=[
        "Authorization",
        "Content-Type",
        "Accept",
        "Origin",
        "X-Requested-With",
    ],
    expose_headers=["*"],
    max_age=600,
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(chats.router, prefix="/api/chats", tags=["Chats"])
app.include_router(messages.router, prefix="/api", tags=["Messages"])
app.include_router(websocket_router, prefix="/api/ws", tags=["WebSocket"])

@app.get("/")
def read_root():
    return {"status": "API is running"}

@app.get("/api/test")
def test_db(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "Database connection successful"}
    except Exception as e:
        return {"status": "Database connection failed", "error": str(e)}
