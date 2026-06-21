from datetime import datetime, timedelta

from sqlalchemy.orm import Session, joinedload

from app.models import Movimiento, Producto


def _parse_fecha(fecha_str: str | None):
    if not fecha_str:
        return None
    try:
        return datetime.strptime(fecha_str.strip(), "%d/%m/%Y")
    except ValueError:
        return None


def _dias_hasta_vencimiento(fecha_str: str | None) -> int | None:
    fecha = _parse_fecha(fecha_str)
    if not fecha:
        return None
    return (fecha.date() - datetime.now().date()).days


def _proveedor_etiqueta(producto: Producto) -> str:
    if not producto.proveedor_rel:
        return "Sin proveedor"
    return producto.proveedor_rel.nombre


def _producto_fila(producto: Producto) -> dict:
    proveedor = producto.proveedor_rel
    return {
        "producto": producto.producto,
        "lote": producto.serial_lote,
        "cantidad": producto.cantidad or 0,
        "fecha_produccion": producto.fecha_produccion or "—",
        "fecha_expiracion": producto.fecha_expiracion or "—",
        "proveedor": _proveedor_etiqueta(producto),
        "proveedor_empresa": proveedor.empresa if proveedor else "—",
    }


def reporte_inventario(db: Session):
    productos = (
        db.query(Producto)
        .options(joinedload(Producto.proveedor_rel))
        .order_by(Producto.producto)
        .all()
    )
    total_unidades = sum(p.cantidad or 0 for p in productos)
    sin_stock = [p for p in productos if (p.cantidad or 0) <= 0]
    stock_bajo = [p for p in productos if 0 < (p.cantidad or 0) <= 50]
    stock_critico = [p for p in productos if 0 < (p.cantidad or 0) <= 20]
    sin_proveedor = [p for p in productos if not p.proveedor_rel]

    proximos_vencer = []
    vencidos = []
    for p in productos:
        dias = _dias_hasta_vencimiento(p.fecha_expiracion)
        if dias is None:
            continue
        if dias < 0:
            vencidos.append({**_producto_fila(p), "dias": dias})
        elif dias <= 30:
            proximos_vencer.append({**_producto_fila(p), "dias": dias})

    proximos_vencer.sort(key=lambda x: x["dias"])
    vencidos.sort(key=lambda x: x["dias"])

    por_proveedor = {}
    for p in productos:
        if not p.proveedor_rel:
            continue
        clave = p.proveedor_rel.nombre
        if clave not in por_proveedor:
            por_proveedor[clave] = {
                "proveedor": clave,
                "empresa": p.proveedor_rel.empresa,
                "productos": 0,
                "unidades": 0,
            }
        por_proveedor[clave]["productos"] += 1
        por_proveedor[clave]["unidades"] += p.cantidad or 0

    entrada_por_proveedor = sorted(por_proveedor.values(), key=lambda x: x["unidades"], reverse=True)

    return {
        "fecha_generacion": datetime.now().strftime("%d/%m/%Y %H:%M"),
        "total_productos": len(productos),
        "total_unidades": total_unidades,
        "sin_stock": [_producto_fila(p) for p in sin_stock],
        "stock_critico": [_producto_fila(p) for p in stock_critico],
        "stock_bajo": [_producto_fila(p) for p in stock_bajo],
        "proximos_vencer": proximos_vencer,
        "vencidos": vencidos,
        "sin_proveedor": [_producto_fila(p) for p in sin_proveedor],
        "entrada_por_proveedor": entrada_por_proveedor,
        "inventario_completo": [_producto_fila(p) for p in productos],
        "recomendaciones": _recomendaciones_inventario(
            sin_stock, stock_critico, proximos_vencer, vencidos, sin_proveedor
        ),
    }


def _recomendaciones_inventario(sin_stock, stock_critico, proximos_vencer, vencidos, sin_proveedor):
    recomendaciones = []
    if sin_proveedor:
        recomendaciones.append(
            f"Asignar proveedor de entrada a {len(sin_proveedor)} producto(s) para completar la trazabilidad logística."
        )
    if vencidos:
        recomendaciones.append(
            f"Retirar o gestionar {len(vencidos)} producto(s) vencido(s) para evitar despachos no conformes."
        )
    if proximos_vencer:
        recomendaciones.append(
            f"Priorizar salida de {len(proximos_vencer)} producto(s) que vencen en los próximos 30 días."
        )
    if sin_stock:
        recomendaciones.append(
            f"Reabastecer {len(sin_stock)} producto(s) sin stock para no interrumpir despachos."
        )
    if stock_critico:
        recomendaciones.append(
            f"Planificar compra urgente de {len(stock_critico)} producto(s) con stock crítico (≤20 unidades)."
        )
    if not recomendaciones:
        recomendaciones.append("El inventario se encuentra en niveles aceptables. Mantener monitoreo periódico.")
    return recomendaciones


def reporte_despachos(db: Session):
    movimientos = (
        db.query(Movimiento)
        .options(
            joinedload(Movimiento.producto_rel).joinedload(Producto.proveedor_rel),
            joinedload(Movimiento.vendedor_rel),
            joinedload(Movimiento.cliente_rel),
        )
        .order_by(Movimiento.id.desc())
        .all()
    )

    pendientes = [m for m in movimientos if (m.estado_despacho or "").upper() != "ENTREGADO"]
    entregados = [m for m in movimientos if (m.estado_despacho or "").upper() == "ENTREGADO"]
    unidades_pendientes = sum(m.cantidad for m in pendientes)
    unidades_entregadas = sum(m.cantidad for m in entregados)

    hoy = datetime.now()
    inicio_semana = hoy - timedelta(days=hoy.weekday())
    semana = []
    for m in movimientos:
        fecha = _parse_fecha(m.fecha_salida)
        if fecha and fecha.date() >= inicio_semana.date():
            semana.append(m)

    por_producto = {}
    por_cliente = {}
    por_proveedor = {}
    for m in movimientos:
        producto = m.producto_rel.producto if m.producto_rel else "Sin producto"
        cliente = m.cliente_rel.nombre if m.cliente_rel else "Sin cliente"
        proveedor = _proveedor_etiqueta(m.producto_rel) if m.producto_rel else "Sin proveedor"
        por_producto[producto] = por_producto.get(producto, 0) + m.cantidad
        por_cliente[cliente] = por_cliente.get(cliente, 0) + m.cantidad
        por_proveedor[proveedor] = por_proveedor.get(proveedor, 0) + m.cantidad

    top_productos = sorted(por_producto.items(), key=lambda x: x[1], reverse=True)[:5]
    top_clientes = sorted(por_cliente.items(), key=lambda x: x[1], reverse=True)[:5]
    top_proveedores = sorted(
        [(nombre, unidades) for nombre, unidades in por_proveedor.items() if nombre != "Sin proveedor"],
        key=lambda x: x[1],
        reverse=True,
    )[:5]

    trazabilidad = [_trazabilidad_fila(m) for m in movimientos[:25]]

    return {
        "fecha_generacion": datetime.now().strftime("%d/%m/%Y %H:%M"),
        "total_despachos": len(movimientos),
        "pendientes_count": len(pendientes),
        "entregados_count": len(entregados),
        "unidades_pendientes": unidades_pendientes,
        "unidades_entregadas": unidades_entregadas,
        "despachos_semana": len(semana),
        "unidades_semana": sum(m.cantidad for m in semana),
        "pendientes": [_movimiento_fila(m) for m in pendientes[:20]],
        "trazabilidad": trazabilidad,
        "top_productos": [{"nombre": n, "unidades": u} for n, u in top_productos],
        "top_clientes": [{"nombre": n, "unidades": u} for n, u in top_clientes],
        "top_proveedores": [{"nombre": n, "unidades": u} for n, u in top_proveedores],
        "recomendaciones": _recomendaciones_despachos(pendientes, semana, top_productos, por_proveedor),
    }


def _movimiento_fila(movimiento: Movimiento) -> dict:
    producto = movimiento.producto_rel
    proveedor = producto.proveedor_rel if producto else None
    return {
        "producto": producto.producto if producto else "—",
        "proveedor": proveedor.nombre if proveedor else "Sin proveedor",
        "cliente": movimiento.cliente_rel.nombre if movimiento.cliente_rel else "—",
        "vendedor": movimiento.vendedor_rel.nombre if movimiento.vendedor_rel else "—",
        "cantidad": movimiento.cantidad,
        "fecha": movimiento.fecha_salida,
        "estado": movimiento.estado_despacho,
    }


def _trazabilidad_fila(movimiento: Movimiento) -> dict:
    producto = movimiento.producto_rel
    proveedor = producto.proveedor_rel if producto else None
    entregado = (movimiento.estado_despacho or "").upper() == "ENTREGADO"
    return {
        "entrada": proveedor.nombre if proveedor else "Sin proveedor",
        "producto": producto.producto if producto else "—",
        "lote": producto.serial_lote if producto else "—",
        "salida": movimiento.cliente_rel.nombre if movimiento.cliente_rel else "—",
        "cantidad": movimiento.cantidad,
        "fecha": movimiento.fecha_salida,
        "etapa": "Entregado" if entregado else "Por entregar",
        "estado": movimiento.estado_despacho,
    }


def _recomendaciones_despachos(pendientes, semana, top_productos, por_proveedor):
    recomendaciones = []
    if pendientes:
        recomendaciones.append(
            f"Coordinar entrega de {len(pendientes)} despacho(s) pendiente(s) para cerrar el ciclo logístico."
        )
    if len(semana) == 0:
        recomendaciones.append("No hay despachos registrados esta semana. Revisar actividad comercial.")
    if top_productos:
        recomendaciones.append(
            f"Verificar stock de «{top_productos[0][0]}», producto con mayor rotación en despachos."
        )
    if por_proveedor.get("Sin proveedor", 0) > 0:
        recomendaciones.append(
            "Hay despachos de productos sin proveedor de entrada. Completar registro en inventario."
        )
    if not recomendaciones:
        recomendaciones.append("La operación de despachos avanza con normalidad.")
    return recomendaciones
