from datetime import datetime

from sqlalchemy.orm import Session, joinedload

from app.models import Movimiento, Producto


class StockInsuficienteError(Exception):
    pass


def _fecha_hoy() -> str:
    return datetime.now().strftime("%d/%m/%Y")


def _parse_fecha(fecha_str: str | None):
    if not fecha_str:
        return datetime.max
    try:
        return datetime.strptime(fecha_str.strip(), "%d/%m/%Y")
    except (TypeError, ValueError):
        return datetime.max


def _parse_fecha_strict(fecha_str: str, campo: str) -> datetime:
    try:
        return datetime.strptime(fecha_str.strip(), "%d/%m/%Y")
    except (TypeError, ValueError) as exc:
        raise ValueError(f"La {campo} es inválida. Use el formato dd/mm/aaaa") from exc


def _validar_fechas_despacho(fecha_pedido: str, fecha_entrega: str | None) -> None:
    """La entrega no puede ser anterior al pedido."""
    pedido_dt = _parse_fecha_strict(fecha_pedido, "fecha de pedido")
    if not (fecha_entrega or "").strip():
        return
    entrega_dt = _parse_fecha_strict(fecha_entrega, "fecha de entrega")
    if entrega_dt < pedido_dt:
        raise ValueError(
            "La fecha de entrega no puede ser anterior a la fecha de pedido"
        )


def _producto_activo(producto: Producto | None) -> bool:
    return bool(producto and (producto.estado or "ACTIVO") == "ACTIVO")


def lotes_fifo(db: Session, nombre_producto: str | None = None, producto_id: int | None = None):
    """Lotes activos ordenados por fecha de producción (PEPS/FIFO)."""
    query = db.query(Producto).filter(Producto.estado == "ACTIVO", Producto.cantidad > 0)
    if producto_id:
        producto = db.get(Producto, producto_id)
        if not producto:
            return []
        query = query.filter(Producto.producto == producto.producto)
    elif nombre_producto:
        query = query.filter(Producto.producto == nombre_producto.strip())
    else:
        return []
    lotes = query.all()
    return sorted(lotes, key=lambda p: (_parse_fecha(p.fecha_produccion), p.id))


def crear_movimiento(
    db: Session,
    producto_id: int,
    vendedor_id: int,
    cliente_id: int,
    cantidad: int,
    estado_despacho: str = "POR ENTREGAR",
    fecha_pedido: str = "",
    fecha_entrega: str = "",
    numero_factura: str = "",
    usar_fifo: bool = True,
):
    if cantidad <= 0:
        raise StockInsuficienteError("La cantidad debe ser mayor a cero")

    producto_base = db.get(Producto, producto_id)
    if not _producto_activo(producto_base):
        raise StockInsuficienteError("El producto seleccionado no está activo")

    fecha_pedido_raw = (fecha_pedido or "").strip()
    if fecha_pedido_raw:
        _parse_fecha_strict(fecha_pedido_raw, "fecha de pedido")
        fecha_pedido_val = fecha_pedido_raw
    else:
        fecha_pedido_val = _fecha_hoy()

    fecha_entrega_val = (fecha_entrega or "").strip()
    factura_val = (numero_factura or "").strip()
    estado = estado_despacho or "POR ENTREGAR"

    if estado == "ENTREGADO" and not fecha_entrega_val:
        fecha_entrega_val = _fecha_hoy()
    if fecha_entrega_val:
        _parse_fecha_strict(fecha_entrega_val, "fecha de entrega")

    _validar_fechas_despacho(fecha_pedido_val, fecha_entrega_val)

    creados: list[Movimiento] = []

    if usar_fifo:
        lotes = lotes_fifo(db, producto_id=producto_id)
        stock_total = sum(l.cantidad for l in lotes)
        if stock_total < cantidad:
            raise StockInsuficienteError(
                f"Inventario insuficiente (disponible {stock_total}, solicitado {cantidad})"
            )
        restante = cantidad
        for lote in lotes:
            if restante <= 0:
                break
            tomar = min(lote.cantidad, restante)
            lote.cantidad -= tomar
            mov = Movimiento(
                producto_id=lote.id,
                vendedor_id=vendedor_id,
                cliente_id=cliente_id,
                cantidad=tomar,
                fecha_salida=_fecha_hoy(),
                fecha_pedido=fecha_pedido_val,
                fecha_entrega=fecha_entrega_val or None,
                numero_factura=factura_val or None,
                estado_despacho=estado,
                estado="ACTIVO",
            )
            db.add(mov)
            creados.append(mov)
            restante -= tomar
    else:
        if producto_base.cantidad < cantidad:
            raise StockInsuficienteError("Inventario insuficiente para el producto seleccionado")
        producto_base.cantidad -= cantidad
        mov = Movimiento(
            producto_id=producto_id,
            vendedor_id=vendedor_id,
            cliente_id=cliente_id,
            cantidad=cantidad,
            fecha_salida=_fecha_hoy(),
            fecha_pedido=fecha_pedido_val,
            fecha_entrega=fecha_entrega_val or None,
            numero_factura=factura_val or None,
            estado_despacho=estado,
            estado="ACTIVO",
        )
        db.add(mov)
        creados.append(mov)

    db.commit()
    for mov in creados:
        db.refresh(mov)
    return creados[0] if len(creados) == 1 else creados


def actualizar_movimiento(
    db: Session,
    movimiento_id: int,
    producto_id: int,
    vendedor_id: int,
    cliente_id: int,
    cantidad: int,
    estado_despacho: str,
    fecha_pedido: str = "",
    fecha_entrega: str = "",
    numero_factura: str = "",
):
    mov = db.get(Movimiento, movimiento_id)
    if not mov or (mov.estado or "ACTIVO") != "ACTIVO":
        raise ValueError("Despacho no encontrado")
    if cantidad <= 0:
        raise StockInsuficienteError("La cantidad debe ser mayor a cero")

    estado = estado_despacho or "POR ENTREGAR"
    fecha_pedido_raw = (fecha_pedido or "").strip()
    if fecha_pedido_raw:
        _parse_fecha_strict(fecha_pedido_raw, "fecha de pedido")
        fecha_pedido_val = fecha_pedido_raw
    else:
        fecha_pedido_val = mov.fecha_pedido or mov.fecha_salida or _fecha_hoy()
        _parse_fecha_strict(fecha_pedido_val, "fecha de pedido")

    fecha_entrega_val = (fecha_entrega or "").strip()
    if estado == "ENTREGADO" and not fecha_entrega_val:
        fecha_entrega_val = _fecha_hoy()
    if fecha_entrega_val:
        _parse_fecha_strict(fecha_entrega_val, "fecha de entrega")

    _validar_fechas_despacho(fecha_pedido_val, fecha_entrega_val)

    producto_anterior = db.get(Producto, mov.producto_id)
    if producto_anterior:
        producto_anterior.cantidad += mov.cantidad

    producto_nuevo = db.get(Producto, producto_id)
    if not _producto_activo(producto_nuevo) or producto_nuevo.cantidad < cantidad:
        db.rollback()
        raise StockInsuficienteError("Inventario insuficiente para actualizar el despacho")

    producto_nuevo.cantidad -= cantidad
    mov.producto_id = producto_id
    mov.vendedor_id = vendedor_id
    mov.cliente_id = cliente_id
    mov.cantidad = cantidad
    mov.estado_despacho = estado
    mov.fecha_pedido = fecha_pedido_val
    mov.fecha_entrega = fecha_entrega_val or None
    mov.numero_factura = (numero_factura or "").strip() or None
    db.commit()
    db.refresh(mov)
    return mov


def anular_movimiento(db: Session, movimiento_id: int):
    """Borrado lógico de despacho: restaura stock y marca ANULADO."""
    mov = db.get(Movimiento, movimiento_id)
    if not mov:
        raise ValueError("Despacho no encontrado")
    if (mov.estado or "ACTIVO") != "ACTIVO":
        raise ValueError("El despacho ya está anulado")
    producto = db.get(Producto, mov.producto_id)
    if producto:
        producto.cantidad += mov.cantidad
    mov.estado = "INACTIVO"
    mov.estado_despacho = "ANULADO"
    db.commit()
    db.refresh(mov)
    return mov


def eliminar_movimiento(db: Session, movimiento_id: int):
    """Compatibilidad: anula en lugar de borrar físicamente."""
    return anular_movimiento(db, movimiento_id)


def movimientos_activos(db: Session):
    return (
        db.query(Movimiento)
        .options(
            joinedload(Movimiento.producto_rel).joinedload(Producto.proveedor_rel),
            joinedload(Movimiento.vendedor_rel),
            joinedload(Movimiento.cliente_rel),
        )
        .filter(Movimiento.estado == "ACTIVO")
        .order_by(Movimiento.id.desc())
    )
