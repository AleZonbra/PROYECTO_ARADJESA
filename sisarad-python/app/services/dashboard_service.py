from collections import defaultdict
from datetime import datetime

from sqlalchemy.orm import Session, joinedload

from app.models import Cliente, Movimiento, Producto, Vendedor


def _parse_fecha(fecha_str: str):
    try:
        return datetime.strptime(fecha_str, "%d/%m/%Y")
    except (TypeError, ValueError):
        return None


def _es_semana_actual(fecha_str: str) -> bool:
    fecha = _parse_fecha(fecha_str)
    if not fecha:
        return False
    hoy = datetime.now()
    return fecha.isocalendar()[:2] == hoy.isocalendar()[:2]


def obtener_resumen_semanal(db: Session):
    movimientos = (
        db.query(Movimiento)
        .options(
            joinedload(Movimiento.producto_rel),
            joinedload(Movimiento.vendedor_rel),
            joinedload(Movimiento.cliente_rel),
        )
        .all()
    )
    semana = [m for m in movimientos if _es_semana_actual(m.fecha_salida)]

    vendedores = {m.vendedor_id for m in semana}
    clientes = {m.cliente_id for m in semana}
    unidades = sum(m.cantidad for m in semana)

    ventas_por_vendedor = defaultdict(int)
    ventas_por_producto = defaultdict(int)
    for m in semana:
        if m.vendedor_rel:
            ventas_por_vendedor[m.vendedor_rel.nombre] += m.cantidad
        if m.producto_rel:
            ventas_por_producto[m.producto_rel.producto] += m.cantidad

    lider = max(ventas_por_vendedor, key=ventas_por_vendedor.get) if ventas_por_vendedor else "NINGUNO"
    top_producto = max(ventas_por_producto, key=ventas_por_producto.get) if ventas_por_producto else "NINGUNO"

    productos_vencer = (
        db.query(Producto)
        .filter(Producto.fecha_expiracion.isnot(None))
        .order_by(Producto.fecha_expiracion)
        .limit(4)
        .all()
    )

    return {
        "unidades_movidas_semana": unidades,
        "vendedores_activos_semana": len(vendedores),
        "clientes_atendidos_semana": len(clientes),
        "despachos_procesados_semana": len(semana),
        "lider_ventas_semana": lider,
        "producto_mas_despachado_semana": top_producto,
        "productos_proximos_vencer": productos_vencer,
    }
