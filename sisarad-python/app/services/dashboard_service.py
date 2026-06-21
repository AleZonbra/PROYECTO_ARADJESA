from datetime import datetime

from sqlalchemy.orm import Session, joinedload

from app.models import Movimiento, Producto


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
    movimientos = db.query(Movimiento).all()
    semana = [m for m in movimientos if _es_semana_actual(m.fecha_salida)]

    vendedores = {m.vendedor_id for m in semana}
    clientes = {m.cliente_id for m in semana}
    unidades = sum(m.cantidad for m in semana)

    productos_vencer = (
        db.query(Producto)
        .options(joinedload(Producto.proveedor_rel))
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
        "productos_proximos_vencer": productos_vencer,
    }
