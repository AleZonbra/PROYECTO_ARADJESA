import logging
import smtplib
from email.message import EmailMessage

from app import config

logger = logging.getLogger("sisarad.email")


def enviar_correo(destinatario: str, asunto: str, cuerpo_texto: str) -> bool:
    if not config.smtp_configurado():
        logger.warning(
            "SMTP no configurado. Define SISARAD_SMTP_HOST, SISARAD_SMTP_USER y SISARAD_SMTP_PASSWORD."
        )
        return False

    mensaje = EmailMessage()
    mensaje["Subject"] = asunto
    mensaje["From"] = config.SMTP_FROM
    mensaje["To"] = destinatario
    mensaje.set_content(cuerpo_texto)

    try:
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
    except Exception:
        logger.exception("No se pudo enviar el correo a %s", destinatario)
        return False
