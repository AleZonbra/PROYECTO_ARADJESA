import json
import logging
import smtplib
from datetime import datetime
from email.message import EmailMessage
from pathlib import Path

from app import config

logger = logging.getLogger("sisarad.email")


def _directorio_correos() -> Path:
    config.CORREOS_DIR.mkdir(parents=True, exist_ok=True)
    return config.CORREOS_DIR


def _guardar_correo_local(destinatario: str, asunto: str, cuerpo_texto: str) -> bool:
    carpeta = _directorio_correos()
    marca = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    archivo = carpeta / f"{marca}.json"
    payload = {
        "fecha": datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
        "destinatario": destinatario,
        "asunto": asunto,
        "cuerpo": cuerpo_texto,
    }
    archivo.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    logger.info("Correo guardado en bandeja local: %s", archivo.name)
    return True


def listar_correos_locales(limite: int = 30) -> list[dict]:
    carpeta = _directorio_correos()
    if not carpeta.exists():
        return []

    correos = []
    for archivo in sorted(carpeta.glob("*.json"), reverse=True):
        try:
            datos = json.loads(archivo.read_text(encoding="utf-8"))
            datos["id"] = archivo.stem
            correos.append(datos)
        except (json.JSONDecodeError, OSError):
            continue
        if len(correos) >= limite:
            break
    return correos


def enviar_por_smtp(destinatario: str, asunto: str, cuerpo_texto: str) -> bool:
    mensaje = EmailMessage()
    mensaje["Subject"] = asunto
    mensaje["From"] = config.SMTP_FROM
    mensaje["To"] = destinatario
    mensaje.set_content(cuerpo_texto)

    if config.SMTP_TLS:
        with smtplib.SMTP(config.SMTP_HOST, config.SMTP_PORT, timeout=20) as servidor:
            servidor.starttls()
            servidor.login(config.SMTP_USER, config.SMTP_PASSWORD)
            servidor.send_message(mensaje)
    else:
        with smtplib.SMTP_SSL(config.SMTP_HOST, config.SMTP_PORT, timeout=20) as servidor:
            servidor.login(config.SMTP_USER, config.SMTP_PASSWORD)
            servidor.send_message(mensaje)
    return True


def enviar_correo(destinatario: str, asunto: str, cuerpo_texto: str) -> bool:
    if config.usar_correo_local():
        return _guardar_correo_local(destinatario, asunto, cuerpo_texto)

    if not config.smtp_configurado():
        logger.warning("SMTP no configurado. Usando bandeja local como respaldo.")
        return _guardar_correo_local(destinatario, asunto, cuerpo_texto)

    try:
        return enviar_por_smtp(destinatario, asunto, cuerpo_texto)
    except Exception:
        logger.exception("No se pudo enviar el correo a %s por SMTP", destinatario)
        return _guardar_correo_local(destinatario, asunto, cuerpo_texto)
