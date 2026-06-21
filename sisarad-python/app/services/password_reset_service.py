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


def _hash_codigo(codigo: str) -> str:
    return hashlib.sha256(codigo.strip().encode("utf-8")).hexdigest()


def _generar_codigo() -> str:
    longitud = config.PASSWORD_RESET_CODE_LENGTH
    maximo = 10**longitud
    return str(secrets.randbelow(maximo)).zfill(longitud)


def _invalidar_tokens_previos(db: Session, usuario_id: str):
    db.query(PasswordResetToken).filter(
        PasswordResetToken.usuario_id == usuario_id,
        PasswordResetToken.used == False,
    ).update({"used": True})


def _obtener_registro_codigo(db: Session, usuario: str, codigo: str) -> tuple[PasswordResetToken | None, Usuario | None]:
    usuario_limpio = usuario.strip().lower()
    codigo_limpio = codigo.strip()

    if not usuario_limpio or not codigo_limpio:
        return None, None

    user = (
        db.query(Usuario)
        .filter(Usuario.usuario == usuario_limpio, Usuario.activo == True)
        .first()
    )
    if not user:
        return None, None

    registro = (
        db.query(PasswordResetToken)
        .filter(
            PasswordResetToken.usuario_id == user.id,
            PasswordResetToken.token_hash == _hash_codigo(codigo_limpio),
            PasswordResetToken.used == False,
        )
        .first()
    )
    if not registro:
        return None, user

    expira = registro.expires_at
    if expira.tzinfo is None:
        expira = expira.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > expira:
        return None, user

    return registro, user


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

    if config.usar_correo_local():
        mensaje_generico = (
            "Si+el+usuario+y+el+correo+coinciden,+el+código+estará+disponible+en+la+bandeja+de+correo"
        )
    else:
        mensaje_generico = (
            "Si+el+usuario+y+el+correo+coinciden,+recibirás+un+código+de+recuperación+en+tu+correo"
        )

    if not user or not user.correo or normalizar_correo(user.correo) != correo_limpio:
        return True, mensaje_generico

    codigo = _generar_codigo()
    expira = datetime.now(timezone.utc) + timedelta(minutes=config.PASSWORD_RESET_EXPIRE_MINUTES)

    _invalidar_tokens_previos(db, user.id)
    db.add(
        PasswordResetToken(
            usuario_id=user.id,
            token_hash=_hash_codigo(codigo),
            expires_at=expira,
            used=False,
        )
    )
    db.commit()

    cuerpo = (
        f"Hola {user.nombre},\n\n"
        "Recibimos una solicitud para restablecer tu contraseña en SISARAD.\n"
        f"Tu código de recuperación es: {codigo}\n\n"
        f"Este código es válido por {config.PASSWORD_RESET_EXPIRE_MINUTES} minutos.\n"
        "Ingresa el código en la pantalla de verificación y luego podrás definir "
        "una nueva contraseña.\n\n"
        "Si no solicitaste este cambio, ignora este mensaje.\n\n"
        "— SISARAD"
    )

    email_service.enviar_correo(user.correo, "Código de recuperación — SISARAD", cuerpo)
    return True, mensaje_generico


def validar_codigo_recuperacion(
    db: Session, usuario: str, codigo: str
) -> tuple[bool, str, PasswordResetToken | None, Usuario | None]:
    registro, user = _obtener_registro_codigo(db, usuario, codigo)
    if not user:
        return False, "Usuario+no+encontrado+o+inactivo", None, None
    if not registro:
        return False, "El+código+no+es+válido+o+ha+expirado", None, user
    return True, "", registro, user


def restablecer_contrasena(db: Session, token_id: int, nueva_clave: str) -> tuple[bool, str]:
    if not nueva_clave.strip():
        return False, "La+nueva+contraseña+es+obligatoria"

    registro = db.get(PasswordResetToken, token_id)
    if not registro or registro.used:
        return False, "La+verificación+expiró.+Solicita+un+nuevo+código"

    expira = registro.expires_at
    if expira.tzinfo is None:
        expira = expira.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > expira:
        return False, "El+código+ha+expirado.+Solicita+uno+nuevo"

    usuario = db.get(Usuario, registro.usuario_id)
    if not usuario or not usuario.activo:
        return False, "Usuario+no+disponible"

    usuario.clave = nueva_clave
    registro.used = True
    _invalidar_tokens_previos(db, usuario.id)
    db.commit()
    return True, "Contraseña+actualizada.+Ya+puedes+iniciar+sesión"
