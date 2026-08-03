from fastapi.testclient import TestClient
from app.main import app

c = TestClient(app)
r = c.post("/login", data={"usuario": "encargado", "clave": "Encargado123!"}, follow_redirects=False)
if r.status_code not in (302, 303):
    r = c.post("/login", data={"usuario": "encargado", "clave": "encargado"}, follow_redirects=False)
print("encargado login", r.status_code, r.headers.get("location"))

r = c.get("/productos?nuevo=1")
print("nuevo producto", r.status_code, "Agregar proveedor" in r.text, 'name="estado"' in r.text)

r = c.get("/productos?nuevo=1&nuevo_proveedor=1")
print("nuevo proveedor", "proveedor-rapido" in r.text)

r = c.get("/productos")
print("desactivar visible encargado", "Desactivar" in r.text)

c2 = TestClient(app)
c2.post("/login", data={"usuario": "admin", "clave": "Admin123!"}, follow_redirects=False)
for path in ["/inicio", "/proveedores", "/clientes", "/vendedores", "/despachos", "/usuarios", "/mi-cuenta", "/productos/reporte"]:
    rr = c2.get(path)
    print(path, rr.status_code)
