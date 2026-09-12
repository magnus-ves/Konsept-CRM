from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, ConfigDict

from models import LeadStatus, LeadPriority


class NoteBase(BaseModel):
    text: str


class NoteCreate(NoteBase):
    pass


class NoteOut(NoteBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    lead_id: int
    created_at: datetime


class LeadBase(BaseModel):
    company_name: str
    industry: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    location: Optional[str] = None
    status: LeadStatus = LeadStatus.NY
    priority: LeadPriority = LeadPriority.MIDDELS
    missing_items: Optional[str] = None
    last_contact_date: Optional[datetime] = None
    next_followup_date: Optional[datetime] = None


class LeadCreate(LeadBase):
    pass


class LeadUpdate(BaseModel):
    company_name: Optional[str] = None
    industry: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    location: Optional[str] = None
    status: Optional[LeadStatus] = None
    priority: Optional[LeadPriority] = None
    missing_items: Optional[str] = None
    last_contact_date: Optional[datetime] = None
    next_followup_date: Optional[datetime] = None


class LeadStatusUpdate(BaseModel):
    status: LeadStatus


class EmailSend(BaseModel):
    subject: str
    message: str


class PublicLeadIntake(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    message: Optional[str] = None
    services: Optional[str] = None


class LeadOut(LeadBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
    notes: List[NoteOut] = []


class DashboardStats(BaseModel):
    total: int
    by_status: dict
    by_priority: dict
    due_this_week: int
    overdue: int
