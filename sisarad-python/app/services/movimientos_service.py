from datetime import datetime

from sqlalchemy.orm import Session

from app.models import Movimiento, Producto


class StockInsuficienteError(Exception):
    pass


def _fecha_hoy():
    return datetime.now().strftime("%d/%m/%Y")


def crear_movimiento(
    db: Session,
    producto_id: int,
    vendedor_id: int,
    cliente_id: int,
    cantidad: int,
    estado_despacho: str = "POR ENTREGAR",
):
    producto = db.get(Producto, producto_id)
    if not producto or producto.cantidad < cantidad:
        raise StockInsuficienteError("Inventario insuficiente para el producto seleccionado")
    producto.cantidad -= cantidad
    mov = Movimiento(
        producto_id=producto_id,
        vendedor_id=vendedor_id,
        cliente_id=cliente_id,
        cantidad=cantidad,
        fecha_salida=_fecha_hoy(),
        estado_despacho=estado_despacho or "POR ENTREGAR",
    )
    db.add(mov)
    db.commit()
    db.refresh(mov)
    return mov


def actualizar_movimiento(
    db: Session,
    movimiento_id: int,
    producto_id: int,
    vendedor_id: int,
    cliente_id: int,
    cantidad: int,
    estado_despacho: str,
):
    mov = db.get(Movimiento, movimiento_id)
    if not mov:
        raise ValueError("Despacho no encontrado")
    producto_anterior = db.get(Producto, mov.producto_id)
    if producto_anterior:
        producto_anterior.cantidad += mov.cantidad
    producto_nuevo = db.get(Producto, producto_id)
    if not producto_nuevo or producto_nuevo.cantidad < cantidad:
        db.rollback()
        raise StockInsuficienteError("Inventario insuficiente para actualizar el despacho")
    producto_nuevo.cantidad -= cantidad
    mov.producto_id = producto_id
    mov.vendedor_id = vendedor_id
    mov.cliente_id = cliente_id
    mov.cantidad = cantidad
    mov.estado_despacho = estado_despacho
    db.commit()
    db.refresh(mov)
    return mov


def eliminar_movimiento(db: Session, movimiento_id: int):
    mov = db.get(Movimiento, movimiento_id)
    if not mov:
        raise ValueError("Despacho no encontrado")
    producto = db.get(Producto, mov.producto_id)
    if producto:
        producto.cantidad += mov.cantidad
    db.delete(mov)
    db.commit()
