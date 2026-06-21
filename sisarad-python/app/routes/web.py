from fastapi import APIRouter, Depends, Form, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app import config
from app.auth import (
    contexto_usuario,
    requiere_admin_sistema,
    requiere_editar,
    requiere_eliminar,
    requiere_modulo,
    requiere_reporte,
    require_user,
)
from app.roles import ADMINISTRADOR_SISTEMA, ENCARGADO_NEGOCIO, etiqueta_rol, modulos_para_rol, normalizar_rol, puede_editar
from app.database import get_db
from app.models import Cliente, Movimiento, Producto, Proveedor, Usuario, Vendedor
from app.pagination import ITEMS_PER_PAGE, paginate
from app.services import dashboard_service, movimientos_service, reportes_service
from app.services import password_reset_service
from app.services.movimientos_service import StockInsuficienteError

public_router = APIRouter()
protected_router = APIRouter()


def _ctx(request: Request, **extra):
    user = require_user(request)
    ctx = {
        "request": request,
        "user": user,
        "active": extra.pop("active", ""),
        "notifications": getattr(request.state, "notifications", []),
        "notification_count": getattr(request.state, "notification_count", 0),
        **extra,
    }
    if user:
        ctx.update(contexto_usuario(request))
    return ctx


def _redirect(path: str, msg: str = "", error: str = ""):
    q = []
    if msg:
        q.append(f"msg={msg}")
    if error:
        q.append(f"error={error}")
    suffix = f"?{'&'.join(q)}" if q else ""
    return RedirectResponse(url=f"{path}{suffix}", status_code=303)


def _filter_items(items, search: str, fields):
    if not search:
        return items
    s = search.lower()
    return [i for i in items if any(s in str(getattr(i, f, "")).lower() for f in fields)]


def _list_qs(page: int, search: str) -> str:
    from urllib.parse import quote

    parts = []
    if page > 1:
        parts.append(f"page={page}")
    if search:
        parts.append(f"q={quote(search)}")
    return f"&{'&'.join(parts)}" if parts else ""


def _get_by_id(db: Session, model, param: str):
    if param and param.isdigit():
        return db.get(model, int(param))
    return None


def _get_producto(db: Session, param: str | None):
    if not param or not param.isdigit():
        return None
    return (
        db.query(Producto)
        .options(joinedload(Producto.proveedor_rel))
        .filter(Producto.id == int(param))
        .first()
    )


def _proveedores_activos(db: Session):
    return db.query(Proveedor).filter(Proveedor.estado == "ACTIVO").order_by(Proveedor.nombre).all()


def _validar_proveedor(db: Session, proveedor_id: int):
    proveedor = db.get(Proveedor, proveedor_id)
    if not proveedor:
        return None, "Proveedor+no+encontrado"
    if (proveedor.estado or "").upper() != "ACTIVO":
        return None, "El+proveedor+seleccionado+no+está+activo"
    return proveedor, None


def _filter_productos(items, search: str):
    if not search:
        return items
    s = search.lower()
    filtrados = []
    for item in items:
        proveedor_txt = ""
        if item.proveedor_rel:
            proveedor_txt = f"{item.proveedor_rel.nombre} {item.proveedor_rel.empresa}".lower()
        if s in item.producto.lower() or s in item.serial_lote.lower() or s in proveedor_txt:
            filtrados.append(item)
    return filtrados


def _get_movimiento(db: Session, param: str):
    if not param or not param.isdigit():
        return None
    return (
        db.query(Movimiento)
        .options(
            joinedload(Movimiento.producto_rel).joinedload(Producto.proveedor_rel),
            joinedload(Movimiento.vendedor_rel),
            joinedload(Movimiento.cliente_rel),
        )
        .filter(Movimiento.id == int(param))
        .first()
    )


def _filter_usuarios(items, search: str):
    if not search:
        return items
    s = search.lower()
    return [
        u
        for u in items
        if s in u.usuario.lower()
        or s in u.nombre.lower()
        or s in (u.correo or "").lower()
        or s in u.role.lower()
        or s in etiqueta_rol(u.role).lower()
    ]


def _correo_disponible(db: Session, correo: str, excluir_id: str | None = None) -> bool:
    correo_limpio = password_reset_service.normalizar_correo(correo)
    query = db.query(Usuario).filter(Usuario.correo == correo_limpio)
    if excluir_id:
        query = query.filter(Usuario.id != excluir_id)
    return query.first() is None


def _get_usuario(db: Session, param: str | None):
    if param:
        return db.get(Usuario, param)
    return None


def _actualizar_sesion_usuario(request: Request, user: Usuario):
    role = normalizar_rol(user.role) or user.role
    request.session["user"] = {
        "id": user.id,
        "nombre": user.nombre,
        "usuario": user.usuario,
        "role": role,
        "role_label": etiqueta_rol(role),
        "modulos_permitidos": modulos_para_rol(role),
    }


def _bloquear_edicion(request: Request, path: str):
    user = require_user(request) or {}
    if request.query_params.get("edit") and not puede_editar(user.get("role")):
        return _redirect(path, error="No+tienes+permiso+para+editar+registros")
    return None


def _eliminar_registro(db: Session, item, path: str, ok_msg: str, blocked_msg: str):
    if not item:
        return _redirect(path, error="Registro+no+encontrado")
    try:
        db.delete(item)
        db.commit()
        return _redirect(path, msg=ok_msg)
    except IntegrityError:
        db.rollback()
        return _redirect(path, error=blocked_msg)


def _tiene_despachos_producto(db: Session, producto_id: int) -> bool:
    return db.query(Movimiento.id).filter(Movimiento.producto_id == producto_id).first() is not None


def _tiene_despachos_cliente(db: Session, cliente_id: int) -> bool:
    return db.query(Movimiento.id).filter(Movimiento.cliente_id == cliente_id).first() is not None


def _tiene_despachos_vendedor(db: Session, vendedor_id: int) -> bool:
    return db.query(Movimiento.id).filter(Movimiento.vendedor_id == vendedor_id).first() is not None


def _auth_page_context(request: Request, **extra) -> dict:
    return {
        "request": request,
        "bandeja_local": config.usar_correo_local(),
        **extra,
    }


def _limpiar_sesion_recuperacion(request: Request) -> None:
    request.session.pop("password_reset", None)


def _sesion_recuperacion(request: Request) -> dict | None:
    data = request.session.get("password_reset")
    if not data or not data.get("token_id") or not data.get("usuario"):
        return None
    return data


def _guardar_sesion_recuperacion(request: Request, usuario: str, token_id: int) -> None:
    request.session["password_reset"] = {
        "usuario": usuario.strip().lower(),
        "token_id": token_id,
    }


# --- Auth ---


@public_router.get("/login")
def login_page(request: Request):
    if require_user(request):
        return RedirectResponse("/inicio", status_code=303)
    return request.app.state.templates.TemplateResponse(
        "login.html",
        {
            "request": request,
            "error": request.query_params.get("error", ""),
            "msg": request.query_params.get("msg", ""),
        },
    )


@public_router.post("/login")
def login_submit(
    request: Request,
    usuario: str = Form(...),
    clave: str = Form(...),
    db: Session = Depends(get_db),
):
    user = db.query(Usuario).filter(Usuario.usuario == usuario, Usuario.clave == clave, Usuario.activo == True).first()
    if not user:
        return RedirectResponse("/login?error=Credenciales+inválidas", status_code=303)
    rol_normalizado = normalizar_rol(user.role)
    if not rol_normalizado:
        return RedirectResponse("/login?error=Credenciales+inválidas", status_code=303)
    if rol_normalizado != user.role:
        user.role = rol_normalizado
        db.commit()
    _actualizar_sesion_usuario(request, user)
    return RedirectResponse("/inicio", status_code=303)


@public_router.get("/logout")
def logout(request: Request):
    request.session.clear()
    return RedirectResponse("/login", status_code=303)


@public_router.get("/bandeja-correo")
def bandeja_correo_page(request: Request):
    if not config.usar_correo_local():
        return RedirectResponse("/login", status_code=303)
    from app.services import email_service

    return request.app.state.templates.TemplateResponse(
        "bandeja_correo.html",
        _auth_page_context(request, correos=email_service.listar_correos_locales()),
    )


@public_router.get("/recuperar-contrasena")
def recuperar_contrasena_page(request: Request):
    if require_user(request):
        return RedirectResponse("/inicio", status_code=303)
    return request.app.state.templates.TemplateResponse(
        "recuperar_contrasena.html",
        _auth_page_context(
            request,
            error=request.query_params.get("error", ""),
            msg=request.query_params.get("msg", ""),
        ),
    )


@public_router.post("/recuperar-contrasena")
def recuperar_contrasena_submit(
    request: Request,
    usuario: str = Form(...),
    correo: str = Form(...),
    db: Session = Depends(get_db),
):
    _limpiar_sesion_recuperacion(request)
    ok, mensaje = password_reset_service.solicitar_recuperacion(db, usuario, correo)
    if not ok:
        return RedirectResponse(f"/recuperar-contrasena?error={mensaje}", status_code=303)
    usuario_limpio = usuario.strip().lower()
    return RedirectResponse(
        f"/verificar-codigo?usuario={usuario_limpio}&msg={mensaje}",
        status_code=303,
    )


@public_router.get("/verificar-codigo")
def verificar_codigo_page(request: Request):
    if require_user(request):
        return RedirectResponse("/inicio", status_code=303)
    return request.app.state.templates.TemplateResponse(
        "verificar_codigo.html",
        _auth_page_context(
            request,
            paso=2,
            usuario=request.query_params.get("usuario", ""),
            error=request.query_params.get("error", ""),
            msg=request.query_params.get("msg", ""),
        ),
    )


@public_router.post("/verificar-codigo")
def verificar_codigo_submit(
    request: Request,
    usuario: str = Form(...),
    codigo: str = Form(...),
    db: Session = Depends(get_db),
):
    ok, mensaje, registro, _user = password_reset_service.validar_codigo_recuperacion(
        db, usuario, codigo
    )
    usuario_limpio = usuario.strip().lower()
    if not ok:
        return RedirectResponse(
            f"/verificar-codigo?usuario={usuario_limpio}&error={mensaje}",
            status_code=303,
        )
    _guardar_sesion_recuperacion(request, usuario_limpio, registro.id)
    return RedirectResponse(
        f"/restablecer-contrasena?msg=Código+verificado.+Ahora+define+tu+nueva+contraseña",
        status_code=303,
    )


@public_router.get("/restablecer-contrasena")
def restablecer_contrasena_page(request: Request):
    if require_user(request):
        return RedirectResponse("/inicio", status_code=303)
    sesion = _sesion_recuperacion(request)
    if not sesion:
        return RedirectResponse(
            "/verificar-codigo?error=Debes+verificar+el+código+antes+de+cambiar+la+contraseña",
            status_code=303,
        )
    return request.app.state.templates.TemplateResponse(
        "restablecer_contrasena.html",
        _auth_page_context(
            request,
            paso=3,
            usuario=sesion["usuario"],
            error=request.query_params.get("error", ""),
            msg=request.query_params.get("msg", ""),
        ),
    )


@public_router.post("/restablecer-contrasena")
def restablecer_contrasena_submit(
    request: Request,
    clave: str = Form(...),
    clave_confirmar: str = Form(...),
    db: Session = Depends(get_db),
):
    sesion = _sesion_recuperacion(request)
    if not sesion:
        return RedirectResponse(
            "/verificar-codigo?error=Debes+verificar+el+código+antes+de+cambiar+la+contraseña",
            status_code=303,
        )
    if clave != clave_confirmar:
        return RedirectResponse(
            "/restablecer-contrasena?error=Las+contraseñas+no+coinciden",
            status_code=303,
        )
    ok, mensaje = password_reset_service.restablecer_contrasena(db, sesion["token_id"], clave)
    if ok:
        _limpiar_sesion_recuperacion(request)
        return RedirectResponse(f"/login?msg={mensaje}", status_code=303)
    return RedirectResponse(f"/restablecer-contrasena?error={mensaje}", status_code=303)


# --- Mi cuenta ---


@protected_router.get("/mi-cuenta", dependencies=[Depends(requiere_modulo("mi_cuenta"))])
def mi_cuenta(request: Request, db: Session = Depends(get_db)):
    current = require_user(request)
    perfil = db.get(Usuario, current["id"])
    if not perfil:
        return RedirectResponse("/login", status_code=303)
    return request.app.state.templates.TemplateResponse(
        "mi_cuenta.html",
        _ctx(
            request,
            active="mi_cuenta",
            perfil=perfil,
            msg=request.query_params.get("msg", ""),
            error=request.query_params.get("error", ""),
        ),
    )


@protected_router.post("/mi-cuenta/actualizar", dependencies=[Depends(requiere_modulo("mi_cuenta"))])
def mi_cuenta_actualizar(
    request: Request,
    nombre: str = Form(...),
    correo: str = Form(...),
    clave_actual: str = Form(""),
    clave_nueva: str = Form(""),
    clave_confirmar: str = Form(""),
    db: Session = Depends(get_db),
):
    current = require_user(request)
    perfil = db.get(Usuario, current["id"])
    if not perfil:
        return _redirect("/login")
    correo_limpio = password_reset_service.normalizar_correo(correo)
    if not password_reset_service.correo_valido(correo_limpio):
        return _redirect("/mi-cuenta", error="El+correo+electrónico+no+es+válido")
    if not _correo_disponible(db, correo_limpio, perfil.id):
        return _redirect("/mi-cuenta", error="Ese+correo+ya+está+registrado")
    if clave_nueva or clave_confirmar or clave_actual:
        if not clave_actual:
            return _redirect("/mi-cuenta", error="Ingresa+tu+contraseña+actual")
        if perfil.clave != clave_actual:
            return _redirect("/mi-cuenta", error="La+contraseña+actual+no+es+correcta")
        if not clave_nueva:
            return _redirect("/mi-cuenta", error="Ingresa+la+nueva+contraseña")
        if clave_nueva != clave_confirmar:
            return _redirect("/mi-cuenta", error="Las+contraseñas+nuevas+no+coinciden")
        perfil.clave = clave_nueva
    perfil.nombre = nombre.strip()
    perfil.correo = correo_limpio
    db.commit()
    _actualizar_sesion_usuario(request, perfil)
    return _redirect("/mi-cuenta", msg="Perfil+actualizado+correctamente")


# --- Dashboard ---


@protected_router.get("/inicio", dependencies=[Depends(requiere_modulo("inicio"))])
def inicio(request: Request, db: Session = Depends(get_db)):
    resumen = dashboard_service.obtener_resumen_semanal(db)
    return request.app.state.templates.TemplateResponse(
        "inicio.html",
        _ctx(request, active="inicio", resumen=resumen, msg=request.query_params.get("msg", ""), error=request.query_params.get("error", "")),
    )


# --- Productos ---


@protected_router.get("/productos", dependencies=[Depends(requiere_modulo("productos"))])
def productos_list(request: Request, db: Session = Depends(get_db)):
    bloqueo = _bloquear_edicion(request, "/productos")
    if bloqueo:
        return bloqueo
    search = request.query_params.get("q", "")
    page = int(request.query_params.get("page", 1))
    items = (
        db.query(Producto)
        .options(joinedload(Producto.proveedor_rel))
        .order_by(Producto.id)
        .all()
    )
    items = _filter_productos(items, search)
    paged = paginate(items, page, ITEMS_PER_PAGE)
    edit_item = _get_producto(db, request.query_params.get("edit"))
    view_item = _get_producto(db, request.query_params.get("ver"))
    proveedores = _proveedores_activos(db)
    return request.app.state.templates.TemplateResponse(
        "productos.html",
        _ctx(
            request,
            active="productos",
            paged=paged,
            search=search,
            list_qs=_list_qs(page, search),
            edit_item=edit_item,
            view_item=view_item,
            proveedores=proveedores,
            show_create=request.query_params.get("nuevo") == "1",
            msg=request.query_params.get("msg", ""),
            error=request.query_params.get("error", ""),
        ),
    )


@protected_router.get("/productos/reporte", dependencies=[Depends(requiere_modulo("productos")), Depends(requiere_reporte("productos"))])
def productos_reporte(request: Request, db: Session = Depends(get_db)):
    reporte = reportes_service.reporte_inventario(db)
    return request.app.state.templates.TemplateResponse(
        "reporte_productos.html",
        _ctx(request, active="productos", reporte=reporte),
    )


@protected_router.post("/productos/crear", dependencies=[Depends(requiere_modulo("productos"))])
def productos_crear(
    request: Request,
    producto: str = Form(...),
    serial_lote: str = Form(...),
    cantidad: int = Form(0),
    fecha_produccion: str = Form(""),
    fecha_expiracion: str = Form(""),
    proveedor_id: int = Form(...),
    db: Session = Depends(get_db),
):
    _, error = _validar_proveedor(db, proveedor_id)
    if error:
        return _redirect("/productos", error=error)
    db.add(
        Producto(
            producto=producto.strip(),
            serial_lote=serial_lote.strip(),
            cantidad=cantidad,
            fecha_produccion=fecha_produccion.strip(),
            fecha_expiracion=fecha_expiracion.strip(),
            proveedor_id=proveedor_id,
        )
    )
    db.commit()
    return _redirect("/productos", msg="Producto+creado+correctamente")


@protected_router.post("/productos/{item_id}/actualizar", dependencies=[Depends(requiere_modulo("productos")), Depends(requiere_editar())])
def productos_actualizar(
    item_id: int,
    producto: str = Form(...),
    serial_lote: str = Form(...),
    cantidad: int = Form(0),
    fecha_produccion: str = Form(""),
    fecha_expiracion: str = Form(""),
    proveedor_id: int = Form(...),
    db: Session = Depends(get_db),
):
    item = db.get(Producto, item_id)
    if not item:
        return _redirect("/productos", error="Producto+no+encontrado")
    _, error = _validar_proveedor(db, proveedor_id)
    if error:
        return _redirect("/productos", error=error)
    item.producto = producto.strip()
    item.serial_lote = serial_lote.strip()
    item.cantidad = cantidad
    item.fecha_produccion = fecha_produccion.strip()
    item.fecha_expiracion = fecha_expiracion.strip()
    item.proveedor_id = proveedor_id
    db.commit()
    return _redirect("/productos", msg="Producto+actualizado")


@protected_router.post("/productos/{item_id}/eliminar", dependencies=[Depends(requiere_modulo("productos")), Depends(requiere_eliminar())])
def productos_eliminar(item_id: int, db: Session = Depends(get_db)):
    item = db.get(Producto, item_id)
    if item and _tiene_despachos_producto(db, item_id):
        return _redirect(
            "/productos",
            error="No+se+puede+eliminar:+el+producto+tiene+despachos+asociados",
        )
    return _eliminar_registro(
        db,
        item,
        "/productos",
        "Producto+eliminado",
        "No+se+puede+eliminar+el+producto",
    )


# --- Vendedores ---


@protected_router.get("/vendedores", dependencies=[Depends(requiere_modulo("vendedores"))])
def vendedores_list(request: Request, db: Session = Depends(get_db)):
    bloqueo = _bloquear_edicion(request, "/vendedores")
    if bloqueo:
        return bloqueo
    search = request.query_params.get("q", "")
    page = int(request.query_params.get("page", 1))
    items = _filter_items(db.query(Vendedor).order_by(Vendedor.id).all(), search, ["nombre", "num_empleado"])
    paged = paginate(items, page, ITEMS_PER_PAGE)
    edit_item = _get_by_id(db, Vendedor, request.query_params.get("edit"))
    view_item = _get_by_id(db, Vendedor, request.query_params.get("ver"))
    return request.app.state.templates.TemplateResponse(
        "vendedores.html",
        _ctx(
            request,
            active="vendedores",
            paged=paged,
            search=search,
            list_qs=_list_qs(page, search),
            edit_item=edit_item,
            view_item=view_item,
            show_create=request.query_params.get("nuevo") == "1",
            msg=request.query_params.get("msg", ""),
            error=request.query_params.get("error", ""),
        ),
    )


@protected_router.post("/vendedores/crear", dependencies=[Depends(requiere_modulo("vendedores"))])
def vendedores_crear(
    nombre: str = Form(...),
    num_empleado: str = Form(...),
    trabajos_realizados: str = Form(""),
    estado: str = Form("ACTIVO"),
    db: Session = Depends(get_db),
):
    db.add(Vendedor(nombre=nombre.strip(), num_empleado=num_empleado.strip(), trabajos_realizados=trabajos_realizados.strip(), estado=estado))
    db.commit()
    return _redirect("/vendedores", msg="Vendedor+creado")


@protected_router.post("/vendedores/{item_id}/actualizar", dependencies=[Depends(requiere_modulo("vendedores")), Depends(requiere_editar())])
def vendedores_actualizar(
    item_id: int,
    nombre: str = Form(...),
    num_empleado: str = Form(...),
    trabajos_realizados: str = Form(""),
    estado: str = Form("ACTIVO"),
    db: Session = Depends(get_db),
):
    item = db.get(Vendedor, item_id)
    if not item:
        return _redirect("/vendedores", error="Vendedor+no+encontrado")
    item.nombre = nombre.strip()
    item.num_empleado = num_empleado.strip()
    item.trabajos_realizados = trabajos_realizados.strip()
    item.estado = estado
    db.commit()
    return _redirect("/vendedores", msg="Vendedor+actualizado")


@protected_router.post("/vendedores/{item_id}/eliminar", dependencies=[Depends(requiere_modulo("vendedores")), Depends(requiere_eliminar())])
def vendedores_eliminar(item_id: int, db: Session = Depends(get_db)):
    item = db.get(Vendedor, item_id)
    if item and _tiene_despachos_vendedor(db, item_id):
        return _redirect(
            "/vendedores",
            error="No+se+puede+eliminar:+el+vendedor+tiene+despachos+asociados",
        )
    return _eliminar_registro(
        db,
        item,
        "/vendedores",
        "Vendedor+eliminado",
        "No+se+puede+eliminar+el+vendedor",
    )


# --- Proveedores ---


@protected_router.get("/proveedores", dependencies=[Depends(requiere_modulo("proveedores"))])
def proveedores_list(request: Request, db: Session = Depends(get_db)):
    bloqueo = _bloquear_edicion(request, "/proveedores")
    if bloqueo:
        return bloqueo
    search = request.query_params.get("q", "")
    page = int(request.query_params.get("page", 1))
    items = _filter_items(db.query(Proveedor).order_by(Proveedor.id).all(), search, ["nombre", "empresa", "telefono"])
    paged = paginate(items, page, ITEMS_PER_PAGE)
    edit_item = _get_by_id(db, Proveedor, request.query_params.get("edit"))
    view_item = _get_by_id(db, Proveedor, request.query_params.get("ver"))
    return request.app.state.templates.TemplateResponse(
        "proveedores.html",
        _ctx(
            request,
            active="proveedores",
            paged=paged,
            search=search,
            list_qs=_list_qs(page, search),
            edit_item=edit_item,
            view_item=view_item,
            show_create=request.query_params.get("nuevo") == "1",
            msg=request.query_params.get("msg", ""),
            error=request.query_params.get("error", ""),
        ),
    )


@protected_router.post("/proveedores/crear", dependencies=[Depends(requiere_modulo("proveedores"))])
def proveedores_crear(
    nombre: str = Form(...),
    telefono: str = Form(...),
    empresa: str = Form(...),
    estado: str = Form("ACTIVO"),
    db: Session = Depends(get_db),
):
    db.add(Proveedor(nombre=nombre.strip(), telefono=telefono.strip(), empresa=empresa.strip(), estado=estado))
    db.commit()
    return _redirect("/proveedores", msg="Proveedor+creado")


@protected_router.post("/proveedores/{item_id}/actualizar", dependencies=[Depends(requiere_modulo("proveedores")), Depends(requiere_editar())])
def proveedores_actualizar(
    item_id: int,
    nombre: str = Form(...),
    telefono: str = Form(...),
    empresa: str = Form(...),
    estado: str = Form("ACTIVO"),
    db: Session = Depends(get_db),
):
    item = db.get(Proveedor, item_id)
    if not item:
        return _redirect("/proveedores", error="Proveedor+no+encontrado")
    item.nombre = nombre.strip()
    item.telefono = telefono.strip()
    item.empresa = empresa.strip()
    item.estado = estado
    db.commit()
    return _redirect("/proveedores", msg="Proveedor+actualizado")


@protected_router.post("/proveedores/{item_id}/eliminar", dependencies=[Depends(requiere_modulo("proveedores")), Depends(requiere_eliminar())])
def proveedores_eliminar(item_id: int, db: Session = Depends(get_db)):
    return _eliminar_registro(
        db,
        db.get(Proveedor, item_id),
        "/proveedores",
        "Proveedor+eliminado",
        "No+se+puede+eliminar+el+proveedor",
    )


# --- Clientes ---


@protected_router.get("/clientes", dependencies=[Depends(requiere_modulo("clientes"))])
def clientes_list(request: Request, db: Session = Depends(get_db)):
    bloqueo = _bloquear_edicion(request, "/clientes")
    if bloqueo:
        return bloqueo
    search = request.query_params.get("q", "")
    page = int(request.query_params.get("page", 1))
    items = _filter_items(db.query(Cliente).order_by(Cliente.id).all(), search, ["nombre", "correo", "telefono"])
    paged = paginate(items, page, ITEMS_PER_PAGE)
    edit_item = _get_by_id(db, Cliente, request.query_params.get("edit"))
    view_item = _get_by_id(db, Cliente, request.query_params.get("ver"))
    return request.app.state.templates.TemplateResponse(
        "clientes.html",
        _ctx(
            request,
            active="clientes",
            paged=paged,
            search=search,
            list_qs=_list_qs(page, search),
            edit_item=edit_item,
            view_item=view_item,
            show_create=request.query_params.get("nuevo") == "1",
            msg=request.query_params.get("msg", ""),
            error=request.query_params.get("error", ""),
        ),
    )


@protected_router.post("/clientes/crear", dependencies=[Depends(requiere_modulo("clientes"))])
def clientes_crear(
    nombre: str = Form(...),
    telefono: str = Form(...),
    correo: str = Form(...),
    direccion: str = Form(...),
    db: Session = Depends(get_db),
):
    db.add(Cliente(nombre=nombre.strip(), telefono=telefono.strip(), correo=correo.strip(), direccion=direccion.strip()))
    db.commit()
    return _redirect("/clientes", msg="Cliente+creado")


@protected_router.post("/clientes/{item_id}/actualizar", dependencies=[Depends(requiere_modulo("clientes")), Depends(requiere_editar())])
def clientes_actualizar(
    item_id: int,
    nombre: str = Form(...),
    telefono: str = Form(...),
    correo: str = Form(...),
    direccion: str = Form(...),
    db: Session = Depends(get_db),
):
    item = db.get(Cliente, item_id)
    if not item:
        return _redirect("/clientes", error="Cliente+no+encontrado")
    item.nombre = nombre.strip()
    item.telefono = telefono.strip()
    item.correo = correo.strip()
    item.direccion = direccion.strip()
    db.commit()
    return _redirect("/clientes", msg="Cliente+actualizado")


@protected_router.post("/clientes/{item_id}/eliminar", dependencies=[Depends(requiere_modulo("clientes")), Depends(requiere_eliminar())])
def clientes_eliminar(item_id: int, db: Session = Depends(get_db)):
    item = db.get(Cliente, item_id)
    if item and _tiene_despachos_cliente(db, item_id):
        return _redirect(
            "/clientes",
            error="No+se+puede+eliminar:+el+cliente+tiene+despachos+asociados",
        )
    return _eliminar_registro(
        db,
        item,
        "/clientes",
        "Cliente+eliminado",
        "No+se+puede+eliminar+el+cliente",
    )


# --- Usuarios (solo administrador del sistema) ---


@protected_router.get("/usuarios", dependencies=[Depends(requiere_modulo("usuarios"))])
def usuarios_list(request: Request, db: Session = Depends(get_db)):
    bloqueo = _bloquear_edicion(request, "/usuarios")
    if bloqueo:
        return bloqueo
    search = request.query_params.get("q", "")
    page = int(request.query_params.get("page", 1))
    items = _filter_usuarios(db.query(Usuario).order_by(Usuario.nombre).all(), search)
    paged = paginate(items, page, ITEMS_PER_PAGE)
    edit_item = _get_usuario(db, request.query_params.get("edit"))
    view_item = _get_usuario(db, request.query_params.get("ver"))
    return request.app.state.templates.TemplateResponse(
        "usuarios.html",
        _ctx(
            request,
            active="usuarios",
            paged=paged,
            search=search,
            list_qs=_list_qs(page, search),
            edit_item=edit_item,
            view_item=view_item,
            show_create=request.query_params.get("nuevo") == "1",
            msg=request.query_params.get("msg", ""),
            error=request.query_params.get("error", ""),
        ),
    )


@protected_router.post("/usuarios/crear", dependencies=[Depends(requiere_modulo("usuarios"))])
def usuarios_crear(
    usuario: str = Form(...),
    nombre: str = Form(...),
    correo: str = Form(...),
    clave: str = Form(...),
    role: str = Form(...),
    activo: str = Form("ACTIVO"),
    db: Session = Depends(get_db),
):
    usuario_limpio = usuario.strip().lower()
    correo_limpio = password_reset_service.normalizar_correo(correo)
    if not usuario_limpio or not clave.strip():
        return _redirect("/usuarios", error="Usuario+y+contraseña+son+obligatorios")
    if not password_reset_service.correo_valido(correo_limpio):
        return _redirect("/usuarios", error="El+correo+electrónico+no+es+válido")
    if not _correo_disponible(db, correo_limpio):
        return _redirect("/usuarios", error="Ese+correo+ya+está+registrado")
    if role not in (ADMINISTRADOR_SISTEMA, ENCARGADO_NEGOCIO):
        return _redirect("/usuarios", error="Rol+inválido")
    if db.query(Usuario).filter(Usuario.usuario == usuario_limpio).first():
        return _redirect("/usuarios", error="El+usuario+ya+existe")
    user_id = usuario_limpio.replace(" ", "_")
    if db.get(Usuario, user_id):
        return _redirect("/usuarios", error="No+se+pudo+crear+el+usuario")
    db.add(
        Usuario(
            id=user_id,
            usuario=usuario_limpio,
            nombre=nombre.strip(),
            correo=correo_limpio,
            clave=clave,
            role=role,
            activo=activo == "ACTIVO",
        )
    )
    db.commit()
    return _redirect("/usuarios", msg="Usuario+creado+correctamente")


@protected_router.post("/usuarios/{item_id}/actualizar", dependencies=[Depends(requiere_modulo("usuarios")), Depends(requiere_editar())])
def usuarios_actualizar(
    item_id: str,
    request: Request,
    nombre: str = Form(...),
    correo: str = Form(...),
    clave: str = Form(""),
    role: str = Form(...),
    activo: str = Form("ACTIVO"),
    db: Session = Depends(get_db),
):
    item = db.get(Usuario, item_id)
    if not item:
        return _redirect("/usuarios", error="Usuario+no+encontrado")
    correo_limpio = password_reset_service.normalizar_correo(correo)
    if not password_reset_service.correo_valido(correo_limpio):
        return _redirect("/usuarios", error="El+correo+electrónico+no+es+válido")
    if not _correo_disponible(db, correo_limpio, item_id):
        return _redirect("/usuarios", error="Ese+correo+ya+está+registrado")
    if role not in (ADMINISTRADOR_SISTEMA, ENCARGADO_NEGOCIO):
        return _redirect("/usuarios", error="Rol+inválido")
    pierde_admin_activo = item.role == ADMINISTRADOR_SISTEMA and item.activo and (
        role != ADMINISTRADOR_SISTEMA or activo != "ACTIVO"
    )
    if pierde_admin_activo:
        admins = db.query(Usuario).filter(Usuario.role == ADMINISTRADOR_SISTEMA, Usuario.activo == True).count()
        if admins <= 1:
            return _redirect("/usuarios", error="Debe+existir+al+menos+un+administrador+activo")
    item.nombre = nombre.strip()
    item.correo = correo_limpio
    if clave.strip():
        item.clave = clave
    item.role = role
    item.activo = activo == "ACTIVO"
    db.commit()
    current = require_user(request)
    if current and current.get("id") == item_id:
        _actualizar_sesion_usuario(request, item)
    return _redirect("/usuarios", msg="Usuario+actualizado")


@protected_router.post("/usuarios/{item_id}/eliminar", dependencies=[Depends(requiere_modulo("usuarios")), Depends(requiere_eliminar())])
def usuarios_eliminar(item_id: str, request: Request, db: Session = Depends(get_db)):
    current = require_user(request)
    if current and current.get("id") == item_id:
        return _redirect("/usuarios", error="No+puedes+eliminar+tu+propia+cuenta")
    item = db.get(Usuario, item_id)
    if not item:
        return _redirect("/usuarios", error="Usuario+no+encontrado")
    if item.role == ADMINISTRADOR_SISTEMA:
        admins = db.query(Usuario).filter(Usuario.role == ADMINISTRADOR_SISTEMA, Usuario.activo == True).count()
        if admins <= 1:
            return _redirect("/usuarios", error="Debe+existir+al+menos+un+administrador+activo")
    db.delete(item)
    db.commit()
    return _redirect("/usuarios", msg="Usuario+eliminado")


# --- Despachos ---


@protected_router.get("/despachos", dependencies=[Depends(requiere_modulo("despachos"))])
def despachos_list(request: Request, db: Session = Depends(get_db)):
    bloqueo = _bloquear_edicion(request, "/despachos")
    if bloqueo:
        return bloqueo
    search = request.query_params.get("q", "")
    page = int(request.query_params.get("page", 1))
    items = (
        db.query(Movimiento)
        .options(
            joinedload(Movimiento.producto_rel).joinedload(Producto.proveedor_rel),
            joinedload(Movimiento.vendedor_rel),
            joinedload(Movimiento.cliente_rel),
        )
        .order_by(Movimiento.id.desc())
        .all()
    )
    if search:
        s = search.lower()
        items = [
            m
            for m in items
            if s in (m.producto_rel.producto if m.producto_rel else "").lower()
            or s in (
                m.producto_rel.proveedor_rel.nombre
                if m.producto_rel and m.producto_rel.proveedor_rel
                else ""
            ).lower()
            or s in (m.vendedor_rel.nombre if m.vendedor_rel else "").lower()
            or s in (m.cliente_rel.nombre if m.cliente_rel else "").lower()
            or s in (m.estado_despacho or "").lower()
        ]
    paged = paginate(items, page, ITEMS_PER_PAGE)
    edit_item = _get_movimiento(db, request.query_params.get("edit"))
    view_item = _get_movimiento(db, request.query_params.get("ver"))
    productos = (
        db.query(Producto)
        .options(joinedload(Producto.proveedor_rel))
        .order_by(Producto.producto)
        .all()
    )
    vendedores = db.query(Vendedor).filter(Vendedor.estado == "ACTIVO").order_by(Vendedor.nombre).all()
    clientes = db.query(Cliente).order_by(Cliente.nombre).all()
    return request.app.state.templates.TemplateResponse(
        "despachos.html",
        _ctx(
            request,
            active="despachos",
            paged=paged,
            search=search,
            list_qs=_list_qs(page, search),
            edit_item=edit_item,
            view_item=view_item,
            show_create=request.query_params.get("nuevo") == "1",
            productos=productos,
            vendedores=vendedores,
            clientes=clientes,
            msg=request.query_params.get("msg", ""),
            error=request.query_params.get("error", ""),
        ),
    )


@protected_router.get("/despachos/reporte", dependencies=[Depends(requiere_modulo("despachos")), Depends(requiere_reporte("despachos"))])
def despachos_reporte(request: Request, db: Session = Depends(get_db)):
    reporte = reportes_service.reporte_despachos(db)
    return request.app.state.templates.TemplateResponse(
        "reporte_despachos.html",
        _ctx(request, active="despachos", reporte=reporte),
    )


@protected_router.post("/despachos/crear", dependencies=[Depends(requiere_modulo("despachos"))])
def despachos_crear(
    producto_id: int = Form(...),
    vendedor_id: int = Form(...),
    cliente_id: int = Form(...),
    cantidad: int = Form(...),
    estado_despacho: str = Form("POR ENTREGAR"),
    db: Session = Depends(get_db),
):
    try:
        movimientos_service.crear_movimiento(db, producto_id, vendedor_id, cliente_id, cantidad, estado_despacho)
        return _redirect("/despachos", msg="Despacho+registrado")
    except StockInsuficienteError as e:
        return _redirect("/despachos", error=str(e).replace(" ", "+"))


@protected_router.post("/despachos/{item_id}/actualizar", dependencies=[Depends(requiere_modulo("despachos")), Depends(requiere_editar())])
def despachos_actualizar(
    item_id: int,
    producto_id: int = Form(...),
    vendedor_id: int = Form(...),
    cliente_id: int = Form(...),
    cantidad: int = Form(...),
    estado_despacho: str = Form("POR ENTREGAR"),
    db: Session = Depends(get_db),
):
    try:
        movimientos_service.actualizar_movimiento(db, item_id, producto_id, vendedor_id, cliente_id, cantidad, estado_despacho)
        return _redirect("/despachos", msg="Despacho+actualizado")
    except (StockInsuficienteError, ValueError) as e:
        return _redirect("/despachos", error=str(e).replace(" ", "+"))


@protected_router.post("/despachos/{item_id}/eliminar", dependencies=[Depends(requiere_modulo("despachos")), Depends(requiere_eliminar())])
def despachos_eliminar(item_id: int, db: Session = Depends(get_db)):
    try:
        movimientos_service.eliminar_movimiento(db, item_id)
        return _redirect("/despachos", msg="Despacho+eliminado")
    except ValueError as e:
        return _redirect("/despachos", error=str(e).replace(" ", "+"))
