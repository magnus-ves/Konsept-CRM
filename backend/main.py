import csv
import io
import os
from datetime import datetime
from typing import Optional, List

from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.orm import Session
from starlette.middleware.base import BaseHTTPMiddleware

import crud
import email_service
import models
import schemas
from database import engine, get_db

_db_init_error = None
try:
    models.Base.metadata.create_all(bind=engine)
except Exception as e:
    _db_init_error = f"{type(e).__name__}: {e}"

app = FastAPI(title="Konsept Mini-CRM")

# Endepunkter som må være tilgjengelige uten passord: helsesjekken, og
# det offentlige kontaktskjema-endepunktet som konsept-media.no poster til.
_PUBLIC_PATHS = {"/api/health", "/api/public/leads"}

APP_PASSWORD = os.environ.get("APP_PASSWORD")


class PasswordProtectMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if (
            not APP_PASSWORD
            or request.method == "OPTIONS"
            or request.url.path in _PUBLIC_PATHS
            or not request.url.path.startswith("/api/")
        ):
            return await call_next(request)
        if request.headers.get("x-app-password") != APP_PASSWORD:
            return JSONResponse({"detail": "Feil passord"}, status_code=401)
        return await call_next(request)


@app.get("/api/health")
def health():
    return {
        "ok": _db_init_error is None,
        "resend_configured": bool(email_service.RESEND_API_KEY),
    }


@app.get("/api/auth/check")
def auth_check():
    return {"ok": True}


app.add_middleware(PasswordProtectMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/leads", response_model=List[schemas.LeadListOut])
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


@app.post("/api/public/leads", response_model=schemas.LeadOut)
def public_lead_intake(payload: schemas.PublicLeadIntake, db: Session = Depends(get_db)):
    """Offentlig, ubeskyttet endepunkt for kontaktskjemaet på konsept-media.no."""
    lead = crud.create_lead(
        db,
        schemas.LeadCreate(
            company_name=payload.name,
            contact_person=payload.name,
            email=payload.email,
            phone=payload.phone,
            missing_items=payload.services,
            status=models.LeadStatus.NY,
            priority=models.LeadPriority.MIDDELS,
            last_contact_date=datetime.utcnow(),
        ),
    )
    note_lines = ["Automatisk opprettet fra kontaktskjemaet på konsept-media.no."]
    if payload.message:
        note_lines.append(f"Melding: {payload.message}")

    if payload.email:
        try:
            email_service.send_email(
                payload.email,
                "Takk for at du tok kontakt med Konsept",
                (
                    f"Hei {payload.name},\n\n"
                    "Takk for at du tok kontakt! Magnus vil kontakte deg fortløpende.\n\n"
                    "Vennlig hilsen\nKonsept"
                ),
            )
            note_lines.append("Automatisk bekreftelses-e-post sendt til besøkende.")
        except email_service.EmailError as e:
            note_lines.append(f"Klarte ikke sende bekreftelses-e-post: {e}")

    crud.add_note(db, lead.id, schemas.NoteCreate(text="\n".join(note_lines)))
    return crud.get_lead(db, lead.id)


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


@app.post("/api/leads/{lead_id}/send-email", response_model=schemas.LeadOut)
def send_lead_email(lead_id: int, payload: schemas.EmailSend, db: Session = Depends(get_db)):
    lead = crud.get_lead(db, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead ikke funnet")
    if not lead.email:
        raise HTTPException(status_code=400, detail="Leaden har ingen e-postadresse registrert")

    try:
        email_service.send_email(lead.email, payload.subject, payload.message)
    except email_service.EmailError as e:
        raise HTTPException(status_code=502, detail=str(e))

    crud.add_note(
        db,
        lead_id,
        schemas.NoteCreate(text=f"E-post sendt til {lead.email} — emne: «{payload.subject}»"),
    )
    updated = crud.update_lead(
        db, lead_id, schemas.LeadUpdate(last_contact_date=datetime.utcnow())
    )
    return updated


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
