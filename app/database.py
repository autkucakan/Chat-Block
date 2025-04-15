from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "postgresql://postgres:-411903-!@localhost:5432/blockchat" #todo: şifreyi değiştir, userı değiştir, böyle bilgileri .env'e al

engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def create_tables():
    # models.py içindeki sınıfların metadata'ya eklenmesi için import ediyoruz
    try:
        from app.models import User, Chat, Message, chat_users
        print("Models imported")
        print("Creating tables...")
        Base.metadata.create_all(bind=engine)
        print("Tables created successfully")
    except Exception as e:
        print(f"Error creating tables: {e}")
        raise

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
