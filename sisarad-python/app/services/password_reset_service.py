import hashlib
import logging
import re
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app import config
from app.models import PasswordResetToken, Usuario
from app.services import email_service

logger = logging.getLogger("sisarad.password_reset")

CORREO_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def normalizar_correo(correo: str) -> str:
    return correo.strip().lower()


def correo_valido(correo: str) -> bool:
    return bool(CORREO_RE.match(normalizar_correo(correo)))


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _invalidar_tokens_previos(db: Session, usuario_id: str):
    db.query(PasswordResetToken).filter(
        PasswordResetToken.usuario_id == usuario_id,
        PasswordResetToken.used == False,
    ).update({"used": True})


def solicitar_recuperacion(db: Session, usuario: str, correo: str) -> tuple[bool, str]:
    usuario_limpio = usuario.strip().lower()
    correo_limpio = normalizar_correo(correo)

    if not usuario_limpio or not correo_limpio:
        return False, "Usuario+y+correo+son+obligatorios"
    if not correo_valido(correo_limpio):
        return False, "El+correo+electrónico+no+es+válido"

    user = (
        db.query(Usuario)
        .filter(
            Usuario.usuario == usuario_limpio,
            Usuario.activo == True,
        )
        .first()
    )

    mensaje_generico = (
        "Si+el+usuario+y+el+correo+coinciden,+recibirás+instrucciones+para+restablecer+tu+contraseña"
    )

    if not user or not user.correo or normalizar_correo(user.correo) != correo_limpio:
        return True, mensaje_generico

    token = secrets.token_urlsafe(32)
    expira = datetime.now(timezone.utc) + timedelta(minutes=config.PASSWORD_RESET_EXPIRE_MINUTES)

    _invalidar_tokens_previos(db, user.id)
    db.add(
        PasswordResetToken(
            usuario_id=user.id,
            token_hash=_hash_token(token),
            expires_at=expira,
            used=False,
        )
    )
    db.commit()

    enlace = f"{config.APP_URL}/restablecer-contrasena?token={token}"
    cuerpo = (
        f"Hola {user.nombre},\n\n"
        "Recibimos una solicitud para restablecer tu contraseña en SISARAD.\n"
        f"Usa este enlace (válido por {config.PASSWORD_RESET_EXPIRE_MINUTES} minutos):\n\n"
        f"{enlace}\n\n"
        "Si no solicitaste este cambio, ignora este mensaje.\n\n"
        "— SISARAD"
    )

    if email_service.enviar_correo(user.correo, "Restablecer contraseña — SISARAD", cuerpo):
        return True, mensaje_generico

    logger.warning("Recuperación para %s — enlace (SMTP no disponible): %s", user.usuario, enlace)
    return True, mensaje_generico


def obtener_usuario_por_token(db: Session, token: str) -> Usuario | None:
    if not token:
        return None
    registro = (
        db.query(PasswordResetToken)
        .filter(
            PasswordResetToken.token_hash == _hash_token(token),
            PasswordResetToken.used == False,
        )
        .first()
    )
    if not registro:
        return None
    expira = registro.expires_at
    if expira.tzinfo is None:
        expira = expira.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > expira:
        return None
    return db.get(Usuario, registro.usuario_id)


def restablecer_contrasena(db: Session, token: str, nueva_clave: str) -> tuple[bool, str]:
    if not nueva_clave.strip():
        return False, "La+nueva+contraseña+es+obligatoria"

    registro = (
        db.query(PasswordResetToken)
        .filter(
            PasswordResetToken.token_hash == _hash_token(token),
            PasswordResetToken.used == False,
        )
        .first()
    )
    if not registro:
        return False, "El+enlace+no+es+válido+o+ya+fue+utilizado"

    expira = registro.expires_at
    if expira.tzinfo is None:
        expira = expira.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > expira:
        return False, "El+enlace+ha+expirado.+Solicita+uno+nuevo"

    usuario = db.get(Usuario, registro.usuario_id)
    if not usuario or not usuario.activo:
        return False, "Usuario+no+disponible"

    usuario.clave = nueva_clave
    registro.used = True
    _invalidar_tokens_previos(db, usuario.id)
    db.commit()
    return True, "Contraseña+actualizada.+Ya+puedes+iniciar+sesión"
