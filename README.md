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
- Send e-post direkte til en lead fra lead-kortet (via Resend) — loggføres
  automatisk som et notat og oppdaterer "siste kontakt"

## Datamodell (lead)

Bedriftsnavn, bransje, kontaktperson, telefon, e-post, nettside, sted,
status (Ny → Kontaktet → Tilbud sendt → Møte avtalt → Kunde / Avslått /
Ikke aktuell), prioritet (Høy/Middels/Lav), hva som mangler hos kunden,
dato for siste kontakt, dato for neste oppfølging, og en tidsstemplet
notatlogg.

## E-postutsendelse (Resend)

For å kunne sende e-post fra en lead trenger backend en Resend API-nøkkel:

1. Opprett en gratis konto på [resend.com](https://resend.com) (3000
   e-poster/mnd gratis) og lag en API-nøkkel.
2. Sett miljøvariabelen `RESEND_API_KEY` på backend-tjenesten (Vercel eller
   Railway).
3. Uten et verifisert domene sendes e-post fra Resends test-avsender
   (`onboarding@resend.dev`). For å sende fra din egen adresse (f.eks.
   `post@konsept-media.no`), verifiser domenet i Resend-dashbordet og sett
   miljøvariabelen `EMAIL_FROM` til f.eks. `Konsept <post@konsept-media.no>`.

## Passordbeskyttelse

Appen er beskyttet med ett delt passord (kun én bruker, som avtalt).

1. Sett miljøvariabelen `APP_PASSWORD` på backend-tjenesten til et passord
   du velger.
2. Redeploy. Neste gang noen åpner appen må de skrive inn passordet.

Uten `APP_PASSWORD` satt er appen åpen for alle (ingen beskyttelse) - sett
den derfor før du deler lenken til appen. Det offentlige kontaktskjema-
endepunktet (`/api/public/leads`) og helsesjekken (`/api/health`) er
unntatt, slik at kontaktskjemaet på konsept-media.no fortsatt fungerer
uten passord.

`RESEND_API_KEY` er koblet til for dette prosjektet.

Uten `RESEND_API_KEY` gir "Send e-post"-knappen en tydelig feilmelding i
appen i stedet for å feile stille.

## Fremtidig utvidelse

Strukturen er lagt til rette for å legge til senere:
- Innlogging/autentisering (per nå kun én bruker)
- Kalenderintegrasjon

## Publisere appen

### Alternativ A: Alt på Vercel i ett prosjekt (anbefalt)

Rot-`vercel.json` bruker Vercels `services`-oppsett til å bygge frontend
og backend som to tjenester i samme prosjekt, uten at du trenger å styre
noen "Root Directory"-innstilling i dashbordet selv:

```json
{
  "services": {
    "frontend": { "root": "frontend/" },
    "backend": { "root": "backend/", "entrypoint": "main:app" }
  },
  "rewrites": [
    { "source": "/api/(.*)", "destination": { "service": "backend" } },
    { "source": "/(.*)", "destination": { "service": "frontend" } }
  ]
}
```

1. Gå til [vercel.com](https://vercel.com) → **Add New… → Project** →
   velg dette repoet. La **Root Directory** stå på repo-roten.
2. Opprett en Postgres-database og koble den til prosjektet, f.eks. via
   Vercel **Storage**-fanen (Postgres) eller [neon.tech](https://neon.tech).
   Dette setter automatisk en miljøvariabel (`POSTGRES_URL`, `DATABASE_URL`
   e.l.) som `backend/database.py` allerede leser — ingen manuell
   konfigurasjon nødvendig.
3. Deploy. Frontend og backend kjører på samme domene
   (`https://<prosjekt>.vercel.app`), så frontend snakker med `/api` uten
   at `VITE_API_URL` trenger å settes.
4. Test: `https://<prosjekt>.vercel.app/api/leads` skal gi `[]`.

### Alternativ B: Backend på Railway + frontend på Vercel

Om du heller vil ha backend som en helt vanlig langlevende server:

1. [railway.app](https://railway.app) → **New Project → Deploy from
   GitHub repo** → velg repoet → sett **Root Directory** til `backend`.
   Railway bruker `Procfile` (`web: uvicorn main:app --host 0.0.0.0 --port
   $PORT`) automatisk.
2. **New → Database → Add PostgreSQL** i samme Railway-prosjekt —
   `DATABASE_URL` kobles til automatisk.
3. **Settings → Networking → Generate Domain** for en offentlig URL.
4. Deploy frontend på Vercel som egen prosjekt (Root Directory: repo-rot),
   med miljøvariabel `VITE_API_URL` = Railway-URL-en + `/api`.

### Oppdateringer senere

Push til branchen prosjektet(ene) er koblet til, så redeployer det
automatisk.
