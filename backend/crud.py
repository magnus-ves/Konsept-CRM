from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session

import models
import schemas


def get_leads(
    db: Session,
    status: Optional[str] = None,
    industry: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
):
    query = db.query(models.Lead)

    if status:
        query = query.filter(models.Lead.status == status)
    if industry:
        query = query.filter(models.Lead.industry == industry)
    if priority:
        query = query.filter(models.Lead.priority == priority)
    if search:
        like = f"%{search}%"
        query = query.filter(
            or_(
                models.Lead.company_name.ilike(like),
                models.Lead.industry.ilike(like),
                models.Lead.location.ilike(like),
            )
        )

    leads = query.all()

    def sort_key(lead):
        return (lead.next_followup_date is None, lead.next_followup_date or datetime.max)

    leads.sort(key=sort_key)
    return leads


def get_lead(db: Session, lead_id: int):
    return db.query(models.Lead).filter(models.Lead.id == lead_id).first()


def create_lead(db: Session, lead: schemas.LeadCreate):
    db_lead = models.Lead(**lead.model_dump())
    db.add(db_lead)
    db.commit()
    db.refresh(db_lead)
    return db_lead


def update_lead(db: Session, lead_id: int, lead: schemas.LeadUpdate):
    db_lead = get_lead(db, lead_id)
    if not db_lead:
        return None
    for field, value in lead.model_dump(exclude_unset=True).items():
        setattr(db_lead, field, value)
    db_lead.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_lead)
    return db_lead


def update_lead_status(db: Session, lead_id: int, status: str):
    db_lead = get_lead(db, lead_id)
    if not db_lead:
        return None
    db_lead.status = status
    db_lead.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_lead)
    return db_lead


def delete_lead(db: Session, lead_id: int):
    db_lead = get_lead(db, lead_id)
    if not db_lead:
        return None
    db.delete(db_lead)
    db.commit()
    return db_lead


def add_note(db: Session, lead_id: int, note: schemas.NoteCreate):
    db_note = models.Note(lead_id=lead_id, text=note.text)
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note


def get_dashboard_stats(db: Session):
    leads = db.query(models.Lead).all()
    now = datetime.utcnow()
    week_from_now = now + timedelta(days=7)

    by_status = {s.value: 0 for s in models.LeadStatus}
    by_priority = {p.value: 0 for p in models.LeadPriority}
    due_this_week = 0
    overdue = 0

    for lead in leads:
        by_status[lead.status.value] = by_status.get(lead.status.value, 0) + 1
        by_priority[lead.priority.value] = by_priority.get(lead.priority.value, 0) + 1
        if lead.next_followup_date:
            if lead.next_followup_date < now:
                overdue += 1
            elif lead.next_followup_date <= week_from_now:
                due_this_week += 1

    return schemas.DashboardStats(
        total=len(leads),
        by_status=by_status,
        by_priority=by_priority,
        due_this_week=due_this_week,
        overdue=overdue,
    )
