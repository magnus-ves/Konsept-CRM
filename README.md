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

## Publisere appen (anbefalt: Railway + Vercel)

Vercel er laget for statiske sider/serverless-funksjoner og passer bra for
frontend, men er unødvendig krøkkete for en vanlig Python-server med
database. Enklest er derfor: **backend på Railway** (kjører som en vanlig
langlevende server, ingen spesialkonfigurasjon nødvendig) og **frontend på
Vercel** (som i dag).

### 1. Deploy backend på Railway

1. Gå til [railway.app](https://railway.app) og logg inn med GitHub.
2. **New Project → Deploy from GitHub repo** → velg dette repoet.
3. Under prosjektinnstillinger, sett **Root Directory** til `backend`.
   Railway oppdager automatisk Python via `requirements.txt` og bruker
   `Procfile` (`web: uvicorn main:app --host 0.0.0.0 --port $PORT`) som
   startkommando — ingen ekstra oppsett nødvendig.
4. Klikk **New → Database → Add PostgreSQL** i samme prosjekt. Railway
   kobler automatisk `DATABASE_URL` til backend-tjenesten din — koden
   plukker denne opp uten at du trenger å gjøre noe manuelt.
5. Under backend-tjenesten → **Settings → Networking → Generate Domain**
   for å få en offentlig URL, f.eks. `https://konsept-crm-api.up.railway.app`.
6. Test: åpne `https://konsept-crm-api.up.railway.app/api/leads` — du bør
   få `[]` tilbake.

### 2. Deploy frontend på Vercel

1. Gå til [vercel.com](https://vercel.com) → **Add New… → Project** →
   velg dette repoet.
2. La **Root Directory** stå på repo-roten (tom) — `vercel.json` i roten
   bygger frontend automatisk.
3. Under **Environment Variables**, legg til:
   - `VITE_API_URL` = `https://konsept-crm-api.up.railway.app/api`
     (URL-en fra steg 1, med `/api` på slutten).
4. Deploy. Du får en URL som `https://konsept-crm.vercel.app` — dette er
   appen du bruker i det daglige.

### Oppdateringer senere

Push til branchen som er koblet til Railway- og Vercel-prosjektene, så
redeployer begge automatisk.

### Alternativ: alt på Vercel (Postgres + serverless Python)

Det er også mulig å kjøre backend som en Vercel-funksjon (se
`backend/vercel.json` og `backend/api/index.py`), med en tilkoblet
Postgres-database (Neon, Vercel Storage eller Nile). Dette krever litt mer
feilsøking rundt Vercels Python-runtime enn Railway-veien over, men koden
støtter begge deler — `database.py` leser `DATABASE_URL`, `POSTGRES_URL`,
`POSTGRES_PRISMA_URL` eller `POSTGRES_URL_NON_POOLING`, uansett hvilken
tjeneste du kobler til.
