"""Pruebas de humo minuciosas para inventario + proveedor rápido + estado."""
from __future__ import annotations

import sys
import traceback

from urllib.parse import parse_qs, urlparse

from fastapi.testclient import TestClient

from app.database import SessionLocal
from app.main import app
from app.models import Producto, Proveedor


def ok(name: str):
    print(f"  PASS  {name}")


def fail_print(name: str, detail: str = ""):
    print(f"  FAIL  {name} :: {detail}")


def query_param(url: str, key: str):
    parsed = urlparse(url)
    values = parse_qs(parsed.query).get(key, [])
    return values[0] if values else None


def main() -> int:
    errors = 0
    client = TestClient(app)

    def check(name, cond, detail=""):
        nonlocal errors
        if cond:
            ok(name)
        else:
            errors += 1
            fail_print(name, detail)

    print("=== 1. Login ===")
    r = client.post("/login", data={"usuario": "admin", "clave": "Admin123!"}, follow_redirects=False)
    if r.status_code not in (302, 303):
        # intentar clave antigua
        r = client.post("/login", data={"usuario": "admin", "clave": "admin"}, follow_redirects=False)
    check("login redirige", r.status_code in (302, 303), f"status={r.status_code}")
    check("login a inicio", (r.headers.get("location") or "").startswith("/inicio"), r.headers.get("location"))

    print("=== 2. Inventario UI ===")
    r = client.get("/productos")
    check("GET /productos 200", r.status_code == 200, str(r.status_code))
    check("columna Estado visible", "Estado" in r.text)
    check("botón Nuevo producto", "Nuevo producto" in r.text)

    print("=== 3. Modal nuevo producto con agregar proveedor ===")
    r = client.get("/productos?nuevo=1")
    check("modal nuevo producto", r.status_code == 200 and "Nuevo producto" in r.text)
    check("link agregar proveedor", "nuevo_proveedor=1" in r.text or "Agregar proveedor" in r.text)
    check("campo Estado en crear", 'name="estado"' in r.text)

    r = client.get("/productos?nuevo=1&nuevo_proveedor=1")
    check("modal nuevo proveedor", r.status_code == 200 and "Nuevo proveedor" in r.text)
    check("form proveedor-rapido", 'action="/productos/proveedor-rapido"' in r.text)

    print("=== 4. Crear proveedor desde flujo producto ===")
    suffix = __import__("time").time_ns() % 100000
    r = client.post(
        "/productos/proveedor-rapido",
        data={
            "nombre": f"PROV TEST {suffix}",
            "telefono": "0414-9990000",
            "empresa": "EMPRESA TEST",
            "rif": f"J-99{suffix}",
            "categoria": "Prueba",
        },
        follow_redirects=False,
    )
    loc = r.headers.get("location") or ""
    check("proveedor-rapido redirect", r.status_code in (302, 303), str(r.status_code))
    check("vuelve a nuevo producto", "nuevo=1" in loc and "proveedor_id=" in loc, loc)
    check("redirect query válida", loc.count("?") == 1, loc)
    proveedor_raw = query_param(loc, "proveedor_id")
    proveedor_id = int(proveedor_raw) if proveedor_raw and proveedor_raw.isdigit() else None
    check("proveedor_id en redirect", proveedor_id is not None, loc)

    db = SessionLocal()
    try:
        prov = db.get(Proveedor, proveedor_id)
        check("proveedor en DB", prov is not None and prov.estado == "ACTIVO", str(prov))
        check("proveedor rif", bool(prov and prov.rif), getattr(prov, "rif", None))
    finally:
        db.close()

    print("=== 5. Crear producto con estado ACTIVO ===")
    r = client.get(f"/productos?nuevo=1&proveedor_id={proveedor_id}")
    check("proveedor preseleccionado UI", str(proveedor_id) in r.text)

    lote = f"LOT-TEST-{suffix}"
    r = client.post(
        "/productos/crear",
        data={
            "producto": f"PROD TEST {suffix}",
            "serial_lote": lote,
            "cantidad": "25",
            "fecha_produccion": "01/01/2026",
            "fecha_expiracion": "01/01/2027",
            "proveedor_id": str(proveedor_id),
            "stock_minimo": "5",
            "estado": "ACTIVO",
        },
        follow_redirects=False,
    )
    check("crear producto redirect", r.status_code in (302, 303), str(r.status_code))
    check("crear sin error", "error=" not in (r.headers.get("location") or ""), r.headers.get("location"))

    db = SessionLocal()
    try:
        prod = (
            db.query(Producto)
            .filter(Producto.serial_lote == lote)
            .order_by(Producto.id.desc())
            .first()
        )
        check("producto en DB", prod is not None)
        check("estado ACTIVO", prod and prod.estado == "ACTIVO", getattr(prod, "estado", None))
        check("proveedor vinculado", prod and prod.proveedor_id == proveedor_id)
        check("stock_minimo 5", prod and prod.stock_minimo == 5, getattr(prod, "stock_minimo", None))
        producto_id = prod.id if prod else None
    finally:
        db.close()

    print("=== 6. Editar a INACTIVO ===")
    check("producto_id disponible", producto_id is not None)
    r = client.post(
        f"/productos/{producto_id}/actualizar",
        data={
            "producto": f"PROD TEST {suffix}",
            "serial_lote": lote,
            "cantidad": "25",
            "fecha_produccion": "01/01/2026",
            "fecha_expiracion": "01/01/2027",
            "proveedor_id": str(proveedor_id),
            "stock_minimo": "5",
            "estado": "INACTIVO",
        },
        follow_redirects=False,
    )
    check("actualizar redirect", r.status_code in (302, 303))
    db = SessionLocal()
    try:
        prod = db.get(Producto, producto_id)
        check("estado INACTIVO", prod and prod.estado == "INACTIVO", getattr(prod, "estado", None))
    finally:
        db.close()

    r = client.get(f"/productos?q=PROD+TEST+{suffix}")
    check("listado filtrado", r.status_code == 200)
    check("badge inactivo en listado", "INACTIVO" in r.text and "badgeInactive" in r.text, r.text[r.text.find("PROD TEST"):r.text.find("PROD TEST")+400] if "PROD TEST" in r.text else "no encontrado")

    print("=== 7. Producto inactivo no aparece en despachos (stock>0 filtro) ===")
    r = client.get("/despachos?nuevo=1")
    check("despachos modal", r.status_code == 200)
    # producto inactivo no debería listarse (filtro estado ACTIVO)
    check("inactivo ausente en select despacho", f"LOT-TEST-{suffix}" not in r.text)

    print("=== 8. Reactivar y agregar lote ===")
    r = client.post(
        f"/productos/{producto_id}/actualizar",
        data={
            "producto": f"PROD TEST {suffix}",
            "serial_lote": lote,
            "cantidad": "25",
            "fecha_produccion": "01/01/2026",
            "fecha_expiracion": "01/01/2027",
            "proveedor_id": str(proveedor_id),
            "stock_minimo": "5",
            "estado": "ACTIVO",
        },
        follow_redirects=False,
    )
    check("reactivar", r.status_code in (302, 303))

    r = client.post(
        "/productos/agregar-lote",
        data={
            "producto": f"PROD TEST {suffix}",
            "serial_lote": f"LOT-TEST-B-{suffix}",
            "cantidad": "10",
            "fecha_produccion": "15/01/2026",
            "fecha_expiracion": "01/01/2027",
            "proveedor_id": str(proveedor_id),
            "stock_minimo": "5",
        },
        follow_redirects=False,
    )
    check("agregar lote", r.status_code in (302, 303) and "error=" not in (r.headers.get("location") or ""), r.headers.get("location"))

    db = SessionLocal()
    try:
        lotes = db.query(Producto).filter(Producto.producto == f"PROD TEST {suffix}", Producto.estado == "ACTIVO").all()
        check("dos lotes activos", len(lotes) == 2, str(len(lotes)))
    finally:
        db.close()

    print("=== 9. Desactivar (borrado lógico) ===")
    r = client.post(f"/productos/{producto_id}/eliminar", follow_redirects=False)
    check("desactivar redirect", r.status_code in (302, 303))
    db = SessionLocal()
    try:
        prod = db.get(Producto, producto_id)
        check("sigue existiendo", prod is not None)
        check("quedó INACTIVO", prod and prod.estado == "INACTIVO", getattr(prod, "estado", None))
    finally:
        db.close()

    print("=== 10. Validaciones ===")
    r = client.post(
        "/productos/proveedor-rapido",
        data={"nombre": "", "telefono": "1", "empresa": "x"},
        follow_redirects=False,
    )
    check("proveedor vacío falla", "error=" in (r.headers.get("location") or ""), r.headers.get("location"))

    r = client.post(
        "/productos/crear",
        data={
            "producto": f"PROD TEST {suffix}",
            "serial_lote": f"LOT-TEST-B-{suffix}",
            "cantidad": "1",
            "proveedor_id": str(proveedor_id),
            "stock_minimo": "0",
            "estado": "ACTIVO",
        },
        follow_redirects=False,
    )
    check("lote duplicado activo falla", "error=" in (r.headers.get("location") or ""), r.headers.get("location"))

    print("=== RESUMEN ===")
    if errors:
        print(f"{errors} prueba(s) fallaron")
        return 1
    print("Todas las pruebas pasaron")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception:
        traceback.print_exc()
        raise SystemExit(1)
