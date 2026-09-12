import enum
from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    Enum,
    ForeignKey,
)
from sqlalchemy.orm import relationship

from database import Base


class LeadStatus(str, enum.Enum):
    NY = "Ny"
    KONTAKTET = "Kontaktet"
    TILBUD_SENDT = "Tilbud sendt"
    MOTE_AVTALT = "Møte avtalt"
    KUNDE = "Kunde"
    AVSLATT = "Avslått"
    IKKE_AKTUELL = "Ikke aktuell"


class LeadPriority(str, enum.Enum):
    HOY = "Høy"
    MIDDELS = "Middels"
    LAV = "Lav"


class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String, nullable=False, index=True)
    industry = Column(String, index=True)
    contact_person = Column(String)
    phone = Column(String)
    email = Column(String)
    website = Column(String)
    location = Column(String)
    status = Column(Enum(LeadStatus), default=LeadStatus.NY, index=True)
    priority = Column(Enum(LeadPriority), default=LeadPriority.MIDDELS, index=True)
    missing_items = Column(Text)
    last_contact_date = Column(DateTime, nullable=True)
    next_followup_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    notes = relationship(
        "Note", back_populates="lead", cascade="all, delete-orphan", order_by="Note.created_at.desc()"
    )


class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False)
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    lead = relationship("Lead", back_populates="notes")
