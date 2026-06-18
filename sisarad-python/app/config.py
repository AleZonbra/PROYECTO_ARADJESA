import os

APP_URL = os.getenv("SISARAD_APP_URL", "http://127.0.0.1:8000").rstrip("/")

SMTP_HOST = os.getenv("SISARAD_SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SISARAD_SMTP_PORT", "587"))
SMTP_USER = os.getenv("SISARAD_SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SISARAD_SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SISARAD_SMTP_FROM", SMTP_USER or "noreply@sisarad.local")
SMTP_TLS = os.getenv("SISARAD_SMTP_TLS", "true").lower() in ("1", "true", "yes")

PASSWORD_RESET_EXPIRE_MINUTES = int(os.getenv("SISARAD_RESET_EXPIRE_MINUTES", "60"))


def smtp_configurado() -> bool:
    return bool(SMTP_HOST and SMTP_USER and SMTP_PASSWORD)
