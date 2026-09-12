import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from main import app  # noqa: E402

# Vercels Python-runtime kjører ASGI-appen direkte via denne `app`-variabelen.
