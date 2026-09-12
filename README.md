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

## Publisere på Vercel

Appen består av to deler som må deployes hver for seg på Vercel (én
frontend, én backend), fordi backend trenger en ekte database i
produksjon — Vercels servere har ikke vedvarende diskplass til SQLite-filen.

### 1. Opprett en gratis Postgres-database (Neon)

1. Gå til [neon.tech](https://neon.tech) og opprett et gratis prosjekt.
2. Kopier connection-stringen (starter med `postgresql://...`).

### 2. Deploy backend

1. Gå til [vercel.com](https://vercel.com) → **Add New… → Project** →
   velg dette repoet.
2. Sett **Root Directory** til `backend`.
3. Under **Environment Variables**, legg til:
   - `DATABASE_URL` = connection-stringen fra Neon.
4. Deploy. Du får en URL som `https://konsept-crm-api.vercel.app`.
5. Test at det virker: åpne `https://konsept-crm-api.vercel.app/api/leads`
   i nettleseren — du bør få `[]` tilbake.

### 3. Deploy frontend

1. Gå tilbake til Vercel → **Add New… → Project** → velg samme repo på
   nytt.
2. Sett **Root Directory** til `frontend` (Vercel oppdager automatisk at
   det er et Vite-prosjekt).
3. Under **Environment Variables**, legg til:
   - `VITE_API_URL` = `https://konsept-crm-api.vercel.app/api`
     (URL-en fra steg 2, med `/api` på slutten).
4. Deploy. Du får en URL som `https://konsept-crm.vercel.app` — dette er
   appen du bruker i det daglige.

### Oppdateringer senere

Push til branchen som er koblet til Vercel-prosjektene, så redeployer
Vercel automatisk begge deler.
