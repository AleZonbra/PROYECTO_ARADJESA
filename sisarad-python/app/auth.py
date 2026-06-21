from fastapi import Request

from app.exceptions import ForbiddenError, NotAuthenticatedError
from app.roles import (
    es_administrador_sistema,
    etiqueta_rol,
    items_menu_para_rol,
    modulos_para_rol,
    normalizar_rol,
    puede_acceder_modulo,
    puede_crear,
    puede_editar,
    puede_eliminar,
    puede_generar_reporte,
)


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


def requiere_editar():
    def _dependency(request: Request):
        require_auth(request)
        user = require_user(request)
        if not puede_editar(user.get("role")):
            raise ForbiddenError()

    return _dependency


def requiere_eliminar():
    def _dependency(request: Request):
        require_auth(request)
        user = require_user(request)
        if not puede_eliminar(user.get("role")):
            raise ForbiddenError()

    return _dependency


def requiere_reporte(modulo: str):
    def _dependency(request: Request):
        require_auth(request)
        user = require_user(request)
        if not puede_generar_reporte(user.get("role"), modulo):
            raise ForbiddenError()

    return _dependency


def sincronizar_usuario_sesion(request: Request, db) -> None:
    from app.models import Usuario
    from app.roles import normalizar_rol

    session_user = request.session.get("user")
    if not session_user or not session_user.get("id"):
        return

    db_user = db.get(Usuario, session_user["id"])
    if not db_user or not db_user.activo:
        request.session.clear()
        return

    role = normalizar_rol(db_user.role)
    if not role:
        request.session.clear()
        return

    if role != db_user.role:
        db_user.role = role
        db.commit()

    request.session["user"] = {
        "id": db_user.id,
        "nombre": db_user.nombre,
        "usuario": db_user.usuario,
        "role": role,
        "role_label": etiqueta_rol(role),
        "modulos_permitidos": modulos_para_rol(role),
    }


def contexto_usuario(request: Request) -> dict:
    user = require_user(request) or {}
    role = user.get("role")
    modulos = user.get("modulos_permitidos") or modulos_para_rol(role)
    return {
        "role_label": user.get("role_label") or etiqueta_rol(role),
        "modulos_permitidos": modulos,
        "menu_items": items_menu_para_rol(role),
        "puede_crear": puede_crear(role),
        "puede_editar": puede_editar(role),
        "puede_eliminar": puede_eliminar(role),
        "puede_reporte_productos": puede_generar_reporte(role, "productos"),
        "puede_reporte_despachos": puede_generar_reporte(role, "despachos"),
    }
