import os
from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode

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

# Administrerte Postgres-tjenester (Neon, Vercel Storage, Nile o.l.) krever
# som regel SSL. Legg til sslmode=require hvis det ikke allerede er angitt.
if SQLALCHEMY_DATABASE_URL.startswith("postgresql://"):
    parts = urlsplit(SQLALCHEMY_DATABASE_URL)
    query = dict(parse_qsl(parts.query))
    query.setdefault("sslmode", "require")
    SQLALCHEMY_DATABASE_URL = urlunsplit(
        (parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment)
    )

connect_args = (
    {"check_same_thread": False}
    if SQLALCHEMY_DATABASE_URL.startswith("sqlite")
    else {}
)

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args=connect_args, pool_pre_ping=True
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
