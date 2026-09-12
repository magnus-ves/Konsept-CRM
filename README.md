# Konsept Mini-CRM

Enkel kundeoppfølgingsapp for enkeltmannsforetaket Konsept (foto, nettsider,
grafisk innhold og markedsføring for lokale bedrifter i Lier/Buskerud).

## Teknisk stack

- **Backend:** FastAPI + SQLAlchemy + SQLite (`backend/`)
- **Frontend:** React + Vite (`frontend/`)

## Kom i gang

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API kjører på `http://localhost:8000`. SQLite-databasen (`konsept_crm.db`)
opprettes automatisk ved første oppstart.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend kjører på `http://localhost:5173` og proxyer `/api`-kall til
backend på port 8000.

## Funksjonalitet

- Liste- og kanban-visning av leads, med filtrering på status, bransje og
  prioritet, samt søk på navn/bransje/sted
- Leads med snarlig eller forfalt oppfølging sorteres/markeres tydelig
- Legg til / rediger / slett lead
- Tidsstemplet notatlogg per lead (overskriver ikke gammel tekst)
- Dashboard med antall leads per status/prioritet og oppfølging denne uken
- Eksport av alle leads til CSV

## Datamodell (lead)

Bedriftsnavn, bransje, kontaktperson, telefon, e-post, nettside, sted,
status (Ny → Kontaktet → Tilbud sendt → Møte avtalt → Kunde / Avslått /
Ikke aktuell), prioritet (Høy/Middels/Lav), hva som mangler hos kunden,
dato for siste kontakt, dato for neste oppfølging, og en tidsstemplet
notatlogg.

## Fremtidig utvidelse

Strukturen er lagt til rette for å legge til senere:
- Innlogging/autentisering (per nå kun én bruker)
- Direkte e-postutsendelse
- Kalenderintegrasjon
