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

EMPRESA_RAZON_SOCIAL = os.getenv("SISARAD_EMPRESA_RAZON_SOCIAL", "Distribuidora ARADJESA C.A.")
EMPRESA_NOMBRE = os.getenv("SISARAD_EMPRESA_NOMBRE", "ARADJESA")
EMPRESA_RIF = os.getenv("SISARAD_EMPRESA_RIF", "J-409055221")
EMPRESA_DIRECCION = os.getenv(
    "SISARAD_EMPRESA_DIRECCION",
    "Sector Moriche II, Zona industrial, Maturin - Edo. Monagas.",
)
EMPRESA_TELEFONO = os.getenv("SISARAD_EMPRESA_TELEFONO", "+58 (424) 900 84 33")
EMPRESA_CORREO = os.getenv("SISARAD_EMPRESA_CORREO", "")
EMPRESA_WEB = os.getenv("SISARAD_EMPRESA_WEB", "")
EMPRESA_SLOGAN = os.getenv("SISARAD_EMPRESA_SLOGAN", "Sistema de Seguimiento Logístico")
EMPRESA_SISTEMA = os.getenv("SISARAD_EMPRESA_SISTEMA", "SISARAD")


def datos_empresa() -> dict:
    return {
        "razon_social": EMPRESA_RAZON_SOCIAL,
        "nombre": EMPRESA_NOMBRE,
        "rif": EMPRESA_RIF,
        "direccion": EMPRESA_DIRECCION,
        "telefono": EMPRESA_TELEFONO,
        "correo": EMPRESA_CORREO,
        "web": EMPRESA_WEB,
        "slogan": EMPRESA_SLOGAN,
        "sistema": EMPRESA_SISTEMA,
    }


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
