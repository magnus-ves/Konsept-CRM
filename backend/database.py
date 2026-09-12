import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Lokalt: SQLite-fil. I produksjon (Vercel): kobler til Postgres, siden
# Vercels serverless-funksjoner ikke har vedvarende disk for en SQLite-fil.
# Når du kobler "Storage" (Postgres) til et Vercel-prosjekt, settes en av
# disse variablene automatisk - vi sjekker dem i prioritert rekkefølge.
SQLALCHEMY_DATABASE_URL = (
    os.environ.get("DATABASE_URL")
    or os.environ.get("POSTGRES_URL")
    or os.environ.get("POSTGRES_PRISMA_URL")
    or os.environ.get("POSTGRES_URL_NON_POOLING")
    or "sqlite:///./konsept_crm.db"
)

# SQLAlchemy krever "postgresql://", mens Vercel/Neon ofte gir "postgres://"
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace(
        "postgres://", "postgresql://", 1
    )

connect_args = (
    {"check_same_thread": False}
    if SQLALCHEMY_DATABASE_URL.startswith("sqlite")
    else {}
)

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
