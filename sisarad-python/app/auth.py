from fastapi import Request

from app.exceptions import ForbiddenError, NotAuthenticatedError
from app.roles import es_administrador_sistema, etiqueta_rol, modulos_para_rol, puede_acceder_modulo


def require_user(request: Request):
    return request.session.get("user")


def require_auth(request: Request):
    if not request.session.get("user"):
        raise NotAuthenticatedError()


def require_admin_sistema(request: Request):
    require_auth(request)
    user = require_user(request)
    if not es_administrador_sistema(user.get("role")):
        raise ForbiddenError()


def verificar_modulo(request: Request, modulo: str):
    require_auth(request)
    user = require_user(request)
    if not puede_acceder_modulo(user.get("role"), modulo):
        raise ForbiddenError()


def requiere_modulo(modulo: str):
    def _dependency(request: Request):
        verificar_modulo(request, modulo)

    return _dependency


def requiere_admin_sistema():
    def _dependency(request: Request):
        require_admin_sistema(request)

    return _dependency


def contexto_usuario(request: Request) -> dict:
    user = require_user(request) or {}
    role = user.get("role")
    return {
        "role_label": user.get("role_label") or etiqueta_rol(role),
        "modulos_permitidos": modulos_para_rol(role),
    }
