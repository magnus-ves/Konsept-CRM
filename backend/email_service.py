import json
import os
import urllib.request
import urllib.error

RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
EMAIL_FROM = os.environ.get("EMAIL_FROM", "Konsept <onboarding@resend.dev>")


class EmailError(Exception):
    pass


def send_email(to: str, subject: str, message: str) -> None:
    if not RESEND_API_KEY:
        raise EmailError(
            "RESEND_API_KEY er ikke satt. Legg til miljøvariabelen i Vercel-prosjektet."
        )

    html_body = "".join(
        f"<p>{line}</p>" for line in message.splitlines() if line.strip()
    ) or "<p></p>"

    payload = json.dumps(
        {
            "from": EMAIL_FROM,
            "to": [to],
            "subject": subject,
            "html": html_body,
            "text": message,
        }
    ).encode("utf-8")

    request = urllib.request.Request(
        "https://api.resend.com/emails",
        data=payload,
        method="POST",
        headers={
            "Authorization": f"Bearer {RESEND_API_KEY}",
            "Content-Type": "application/json",
        },
    )

    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            response.read()
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")
        raise EmailError(f"Resend avviste sendingen ({e.code}): {detail}") from e
    except urllib.error.URLError as e:
        raise EmailError(f"Kunne ikke nå Resend: {e.reason}") from e
