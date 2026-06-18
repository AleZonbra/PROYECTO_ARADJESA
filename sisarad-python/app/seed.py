from datetime import datetime

from sqlalchemy.orm import Session

from app.models import Cliente, Movimiento, Producto, Proveedor, Usuario, Vendedor
from app.services import movimientos_service


def seed_usuarios(db: Session):
    usuarios_demo = [
        {
            "id": "admin",
            "usuario": "admin",
            "nombre": "Administrador del Sistema",
            "clave": "admin",
            "role": "administrador_sistema",
        },
        {
            "id": "encargado",
            "usuario": "encargado",
            "nombre": "Encargado de Negocio",
            "clave": "encargado",
            "role": "encargado_negocio",
        },
    ]
    for datos in usuarios_demo:
        existente = db.get(Usuario, datos["id"])
        if existente:
            existente.usuario = datos["usuario"]
            existente.nombre = datos["nombre"]
            existente.clave = datos["clave"]
            existente.role = datos["role"]
            existente.activo = True
        else:
            db.add(Usuario(**datos, activo=True))
    for usuario in db.query(Usuario).all():
        if usuario.role == "administrador":
            usuario.role = "administrador_sistema"
    db.commit()


def seed_productos(db: Session):
    if db.query(Producto).count() > 0:
        return
    datos = [
        ("ARROZ PREMIUM 1KG", "LOT-2026-001", 120, "01/01/2026", "01/01/2027"),
        ("ACEITE VEGETAL 900ML", "LOT-2026-002", 85, "05/01/2026", "05/07/2026"),
        ("HARINA PAN 1KG", "LOT-2026-003", 200, "10/01/2026", "10/10/2026"),
        ("AZÚCAR BLANCA 1KG", "LOT-2026-004", 150, "12/01/2026", "12/12/2026"),
        ("PASTA SPAGHETTI 500G", "LOT-2026-005", 95, "15/01/2026", "15/08/2026"),
        ("ATÚN EN LATA 140G", "LOT-2026-006", 60, "18/01/2026", "18/06/2027"),
        ("LECHE EN POLVO 400G", "LOT-2026-007", 75, "20/01/2026", "20/01/2027"),
        ("CAFÉ MOLIDO 250G", "LOT-2026-008", 40, "22/01/2026", "22/04/2026"),
        ("SAL REFINADA 1KG", "LOT-2026-009", 180, "25/01/2026", "25/12/2027"),
        ("SARDINAS EN LATA 170G", "LOT-2026-010", 55, "28/01/2026", "28/09/2026"),
        ("MAÍZ PAN 1KG", "LOT-2026-011", 110, "02/02/2026", "02/02/2027"),
        ("GALLETAS MARÍA 200G", "LOT-2026-012", 90, "05/02/2026", "05/08/2026"),
        ("JABÓN DE TOCADOR", "LOT-2026-013", 130, "08/02/2026", "08/02/2028"),
        ("DETERGENTE 1KG", "LOT-2026-014", 70, "10/02/2026", "10/10/2027"),
        ("PAPEL HIGIÉNICO 4U", "LOT-2026-015", 45, "12/02/2026", "12/12/2028"),
    ]
    for d in datos:
        db.add(
            Producto(
                producto=d[0],
                serial_lote=d[1],
                cantidad=d[2],
                fecha_produccion=d[3],
                fecha_expiracion=d[4],
            )
        )
    db.commit()


def seed_vendedores(db: Session):
    if db.query(Vendedor).count() > 0:
        return
    datos = [
        ("CARLOS MENDOZA", "EMP-001", "DESPACHOS ZONA NORTE"),
        ("MARÍA GONZÁLEZ", "EMP-002", "VENTAS MAYORISTAS"),
        ("JOSÉ RODRÍGUEZ", "EMP-003", "RUTA CENTRO"),
        ("ANA PÉREZ", "EMP-004", "DESPACHOS EXPRESS"),
        ("LUIS HERRERA", "EMP-005", "ZONA SUR"),
        ("PATRICIA SILVA", "EMP-006", "CLIENTES CORPORATIVOS"),
        ("RICARDO TORRES", "EMP-007", "RUTA ESTE"),
        ("ELENA MARTÍNEZ", "EMP-008", "DESPACHOS NOCTURNOS"),
        ("FERNANDO DÍAZ", "EMP-009", "VENTAS DETAL"),
        ("SOFÍA RAMÍREZ", "EMP-010", "ZONA OESTE"),
        ("DIEGO CASTRO", "EMP-011", "LOGÍSTICA INTERNA"),
        ("VALENTINA LOPEZ", "EMP-012", "DESPACHOS ESPECIALES"),
    ]
    for d in datos:
        db.add(Vendedor(nombre=d[0], num_empleado=d[1], trabajos_realizados=d[2], estado="ACTIVO"))
    db.commit()


def seed_proveedores(db: Session):
    if db.query(Proveedor).count() > 0:
        return
    datos = [
        ("DISTRIBUIDORA ALIMENTOS C.A.", "0212-5550101", "ALIMENTOS DEL VALLE"),
        ("COMERCIAL LA GRANJA", "0212-5550102", "LA GRANJA"),
        ("IMPORTADORA NACIONAL", "0212-5550103", "IMPORTNAC"),
        ("PROVEEDORA DEL CENTRO", "0212-5550104", "PROCEN"),
        ("SUMINISTROS INDUSTRIALES", "0212-5550105", "SUMIND"),
        ("ALMACÉN EL PROGRESO", "0212-5550106", "EL PROGRESO"),
        ("DISTRIBUCIONES MIRANDA", "0212-5550107", "MIRANDA DIST"),
        ("COMERCIALIZADORA UNIDA", "0212-5550108", "COMUNIDA"),
        ("GRUPO SUMINISTRO TOTAL", "0212-5550109", "GST"),
        ("LOGÍSTICA Y ABASTO", "0212-5550110", "LOGABASTO"),
        ("PROVEEDORA METRÓNICA", "0212-5550111", "METRONICA"),
        ("DISTRIBUIDORA ARADJESA", "0212-5550112", "ARADJESA"),
    ]
    for d in datos:
        db.add(Proveedor(nombre=d[0], telefono=d[1], empresa=d[2], estado="ACTIVO"))
    db.commit()


def seed_clientes(db: Session):
    if db.query(Cliente).count() > 0:
        return
    datos = [
        ("SUPERMERCADO LA ESQUINA", "0414-1000001", "esquina@mail.com", "AV. PRINCIPAL LOCAL 1"),
        ("ABASTO EL ÉXITO", "0414-1000002", "exito@mail.com", "CALLE 5 CON CARRERA 8"),
        ("COMERCIAL SAN JOSÉ", "0414-1000003", "sanjose@mail.com", "URB. LOS ROSALES"),
        ("MINI MARKET 24H", "0414-1000004", "24h@mail.com", "AV. BOLÍVAR EDIF. 12"),
        ("DISTRIBUIDORA NORTE", "0414-1000005", "norte@mail.com", "ZONA INDUSTRIAL NORTE"),
        ("ABASTO FAMILIAR", "0414-1000006", "familiar@mail.com", "SECTOR LA LAGUNA"),
        ("COMERCIAL EL PARAÍSO", "0414-1000007", "paraiso@mail.com", "AV. INTERCOMUNAL"),
        ("TIENDA LA ECONÓMICA", "0414-1000008", "economica@mail.com", "CALLE COMERCIO 45"),
        ("MERCADO CENTRAL", "0414-1000009", "central@mail.com", "MERCADO MUNICIPAL PISO 2"),
        ("ABASTO LOS SAMANES", "0414-1000010", "samanes@mail.com", "URB. SAMANES"),
        ("COMERCIAL MIRAFLORES", "0414-1000011", "miraflores@mail.com", "AV. MIRAFLORES 200"),
        ("MINI ABASTO EXPRESS", "0414-1000012", "express@mail.com", "SECTOR EL VALLE"),
        ("DISTRIBUIDORA SUR", "0414-1000013", "sur@mail.com", "ZONA INDUSTRIAL SUR"),
        ("COMERCIAL LA FUENTE", "0414-1000014", "lafuente@mail.com", "AV. LA FUENTE 88"),
        ("ABASTO EL TRIGAL", "0414-1000015", "trigal@mail.com", "URB. EL TRIGAL"),
    ]
    for d in datos:
        db.add(Cliente(nombre=d[0], telefono=d[1], correo=d[2], direccion=d[3]))
    db.commit()


def seed_movimientos(db: Session):
    if db.query(Movimiento).count() > 0:
        return
    despachos = [
        (1, 1, 1, 10, "POR ENTREGAR"),
        (2, 2, 2, 5, "ENTREGADO"),
        (3, 3, 3, 15, "POR ENTREGAR"),
        (4, 4, 4, 8, "ENTREGADO"),
        (5, 5, 5, 12, "POR ENTREGAR"),
        (6, 6, 6, 6, "ENTREGADO"),
        (7, 7, 7, 20, "POR ENTREGAR"),
        (8, 8, 8, 4, "ENTREGADO"),
        (9, 9, 9, 25, "POR ENTREGAR"),
        (10, 10, 10, 7, "ENTREGADO"),
        (11, 11, 11, 9, "POR ENTREGAR"),
        (12, 12, 12, 11, "ENTREGADO"),
    ]
    for d in despachos:
        movimientos_service.crear_movimiento(
            db,
            producto_id=d[0],
            vendedor_id=d[1],
            cliente_id=d[2],
            cantidad=d[3],
            estado_despacho=d[4],
        )


def inicializar_datos(db: Session):
    seed_usuarios(db)
    seed_productos(db)
    seed_vendedores(db)
    seed_proveedores(db)
    seed_clientes(db)
    seed_movimientos(db)
