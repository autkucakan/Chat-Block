from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.database import get_db, create_tables
from sqlalchemy.orm import Session
from sqlalchemy.sql import text
from app.routers import auth, users, chats, messages

create_tables()

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # api.blockchat.com olacak: origins var kullanılacak
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"], # kullanılabilecek http methodları
    allow_headers=[
        "Authorization",
        "Content-Type",
        "Accept",
        "Origin",
        "X-Requested-With",
    ], # izin verilen http headerlari
    expose_headers=["*"],
    max_age=600, # 10 dakika (cors ön kontrol önbellek süresi)
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(chats.router, prefix="/api/chats", tags=["Chats"])
app.include_router(messages.router, prefix="/api/messages", tags=["Messages"])

@app.get("/")
def read_root(): #api çalışıyor mu
    return {"status": "API 200"}

@app.get("/api/test") #DB bağlanıyor mu
def test_db(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT 1"))
    return {"status": "DB 200"} #Çalışmıyorsa 500 döndürüyor zaten

