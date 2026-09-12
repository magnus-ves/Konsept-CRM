import csv
import io
from typing import Optional, List

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

import crud
import models
import schemas
from database import engine, get_db

_db_init_error = None
try:
    models.Base.metadata.create_all(bind=engine)
except Exception as e:
    _db_init_error = f"{type(e).__name__}: {e}"

app = FastAPI(title="Konsept Mini-CRM")


@app.get("/api/health")
def health():
    return {"ok": _db_init_error is None}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/leads", response_model=List[schemas.LeadOut])
def list_leads(
    status: Optional[str] = None,
    industry: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    return crud.get_leads(db, status=status, industry=industry, priority=priority, search=search)


@app.post("/api/leads", response_model=schemas.LeadOut)
def create_lead(lead: schemas.LeadCreate, db: Session = Depends(get_db)):
    return crud.create_lead(db, lead)


@app.get("/api/leads/{lead_id}", response_model=schemas.LeadOut)
def get_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = crud.get_lead(db, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead ikke funnet")
    return lead


@app.put("/api/leads/{lead_id}", response_model=schemas.LeadOut)
def update_lead(lead_id: int, lead: schemas.LeadUpdate, db: Session = Depends(get_db)):
    updated = crud.update_lead(db, lead_id, lead)
    if not updated:
        raise HTTPException(status_code=404, detail="Lead ikke funnet")
    return updated


@app.patch("/api/leads/{lead_id}/status", response_model=schemas.LeadOut)
def update_lead_status(lead_id: int, payload: schemas.LeadStatusUpdate, db: Session = Depends(get_db)):
    updated = crud.update_lead_status(db, lead_id, payload.status)
    if not updated:
        raise HTTPException(status_code=404, detail="Lead ikke funnet")
    return updated


@app.delete("/api/leads/{lead_id}")
def delete_lead(lead_id: int, db: Session = Depends(get_db)):
    deleted = crud.delete_lead(db, lead_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Lead ikke funnet")
    return {"ok": True}


@app.post("/api/leads/{lead_id}/notes", response_model=schemas.NoteOut)
def add_note(lead_id: int, note: schemas.NoteCreate, db: Session = Depends(get_db)):
    lead = crud.get_lead(db, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead ikke funnet")
    return crud.add_note(db, lead_id, note)


@app.get("/api/dashboard", response_model=schemas.DashboardStats)
def dashboard(db: Session = Depends(get_db)):
    return crud.get_dashboard_stats(db)


@app.get("/api/export/csv")
def export_csv(db: Session = Depends(get_db)):
    leads = crud.get_leads(db)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        [
            "Bedrift",
            "Bransje",
            "Kontaktperson",
            "Telefon",
            "E-post",
            "Nettside",
            "Sted",
            "Status",
            "Prioritet",
            "Hva mangler",
            "Siste kontakt",
            "Neste oppfølging",
        ]
    )
    for lead in leads:
        writer.writerow(
            [
                lead.company_name,
                lead.industry or "",
                lead.contact_person or "",
                lead.phone or "",
                lead.email or "",
                lead.website or "",
                lead.location or "",
                lead.status.value,
                lead.priority.value,
                lead.missing_items or "",
                lead.last_contact_date.strftime("%Y-%m-%d") if lead.last_contact_date else "",
                lead.next_followup_date.strftime("%Y-%m-%d") if lead.next_followup_date else "",
            ]
        )

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=leads.csv"},
    )


@app.get("/api/meta/statuses")
def get_statuses():
    return [s.value for s in models.LeadStatus]


@app.get("/api/meta/priorities")
def get_priorities():
    return [p.value for p in models.LeadPriority]
