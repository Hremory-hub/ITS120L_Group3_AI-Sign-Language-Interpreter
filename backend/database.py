from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# MySQL 8 container mapped to host port 3307
DATABASE_URL = "mysql+pymysql://root:root@localhost:3307/asl_db"

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,   # drops stale connections gracefully
    pool_recycle=3600,
)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()


def get_db():
    """FastAPI dependency — yields a session and always closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
