import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

APP_URL = os.getenv("SISARAD_APP_URL", "http://127.0.0.1:8000").rstrip("/")

EMAIL_MODE = os.getenv("SISARAD_EMAIL_MODE", "auto").strip().lower()

SMTP_HOST = os.getenv("SISARAD_SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SISARAD_SMTP_PORT", "587"))
SMTP_USER = os.getenv("SISARAD_SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SISARAD_SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SISARAD_SMTP_FROM", SMTP_USER or "SISARAD <noreply@sisarad.local>")
SMTP_TLS = os.getenv("SISARAD_SMTP_TLS", "true").lower() in ("1", "true", "yes")

PASSWORD_RESET_EXPIRE_MINUTES = int(os.getenv("SISARAD_RESET_EXPIRE_MINUTES", "60"))
PASSWORD_RESET_CODE_LENGTH = int(os.getenv("SISARAD_RESET_CODE_LENGTH", "6"))

CORREOS_DIR = BASE_DIR / "data" / "correos"


def smtp_configurado() -> bool:
    return bool(SMTP_HOST and SMTP_USER and SMTP_PASSWORD)


def usar_correo_local() -> bool:
    if EMAIL_MODE == "local":
        return True
    if EMAIL_MODE == "smtp":
        return False
    return not smtp_configurado()


def resumen_correo() -> dict:
    local = usar_correo_local()
    return {
        "modo": "local" if local else "smtp",
        "smtp_configurado": smtp_configurado(),
        "host": SMTP_HOST or "—",
        "port": SMTP_PORT,
        "user": SMTP_USER or "—",
        "from": SMTP_FROM,
        "tls": SMTP_TLS,
        "bandeja_local": local,
    }
