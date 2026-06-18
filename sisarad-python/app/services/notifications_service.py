from datetime import datetime

from sqlalchemy.orm import Session, joinedload

from app.models import Movimiento, Producto

DIAS_ALERTA_EXPIRACION = 30
STOCK_BAJO_UMBRAL = 50
STOCK_CRITICO_UMBRAL = 20
MAX_NOTIFICACIONES = 25


def _parse_fecha(fecha_str: str):
    try:
        return datetime.strptime(fecha_str, "%d/%m/%Y")
    except (TypeError, ValueError):
        return None


def _prioridad(nivel: str) -> int:
    return {"danger": 0, "warning": 1, "info": 2}.get(nivel, 3)


def obtener_notificaciones(db: Session) -> list[dict]:
    notificaciones: list[dict] = []
    hoy = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

    productos = db.query(Producto).order_by(Producto.producto).all()
    for producto in productos:
        fecha_exp = _parse_fecha(producto.fecha_expiracion)
        if fecha_exp:
            dias = (fecha_exp.replace(hour=0, minute=0, second=0, microsecond=0) - hoy).days
            if dias < 0:
                notificaciones.append(
                    {
                        "id": f"exp-{producto.id}",
                        "tipo": "expiracion",
                        "nivel": "danger",
                        "titulo": "Producto vencido",
                        "mensaje": f"{producto.producto} venció el {producto.fecha_expiracion}.",
                        "enlace": f"/productos?ver={producto.id}",
                    }
                )
            elif dias <= DIAS_ALERTA_EXPIRACION:
                notificaciones.append(
                    {
                        "id": f"exp-{producto.id}",
                        "tipo": "expiracion",
                        "nivel": "warning",
                        "titulo": "Expiración próxima",
                        "mensaje": f"{producto.producto} vence en {dias} día{'s' if dias != 1 else ''} ({producto.fecha_expiracion}).",
                        "enlace": f"/productos?ver={producto.id}",
                    }
                )

        if producto.cantidad <= STOCK_BAJO_UMBRAL:
            nivel = "danger" if producto.cantidad <= STOCK_CRITICO_UMBRAL else "warning"
            notificaciones.append(
                {
                    "id": f"stock-{producto.id}",
                    "tipo": "stock",
                    "nivel": nivel,
                    "titulo": "Stock bajo",
                    "mensaje": f"{producto.producto} tiene solo {producto.cantidad} unidad{'es' if producto.cantidad != 1 else ''} disponible.",
                    "enlace": f"/productos?ver={producto.id}",
                }
            )

    movimientos = (
        db.query(Movimiento)
        .options(
            joinedload(Movimiento.producto_rel),
            joinedload(Movimiento.vendedor_rel),
            joinedload(Movimiento.cliente_rel),
        )
        .order_by(Movimiento.id.desc())
        .all()
    )

    for movimiento in movimientos:
        producto_nombre = movimiento.producto_rel.producto if movimiento.producto_rel else "Producto"
        cliente_nombre = movimiento.cliente_rel.nombre if movimiento.cliente_rel else "Cliente"

        if movimiento.estado_despacho == "POR ENTREGAR":
            notificaciones.append(
                {
                    "id": f"desp-pend-{movimiento.id}",
                    "tipo": "despacho",
                    "nivel": "warning",
                    "titulo": "Despacho pendiente",
                    "mensaje": f"{producto_nombre} ({movimiento.cantidad} uds.) para {cliente_nombre} aún no se entrega.",
                    "enlace": f"/despachos?ver={movimiento.id}",
                }
            )
            continue

        fecha_mov = _parse_fecha(movimiento.fecha_salida)
        if not fecha_mov:
            continue
        dias_antiguedad = (hoy - fecha_mov.replace(hour=0, minute=0, second=0, microsecond=0)).days
        if 0 <= dias_antiguedad <= 7:
            notificaciones.append(
                {
                    "id": f"desp-rec-{movimiento.id}",
                    "tipo": "despacho",
                    "nivel": "info",
                    "titulo": "Despacho reciente",
                    "mensaje": f"Despacho entregado: {producto_nombre} a {cliente_nombre} ({movimiento.fecha_salida}).",
                    "enlace": f"/despachos?ver={movimiento.id}",
                }
            )

    notificaciones.sort(key=lambda n: (_prioridad(n["nivel"]), n["titulo"]))
    return notificaciones[:MAX_NOTIFICACIONES]
