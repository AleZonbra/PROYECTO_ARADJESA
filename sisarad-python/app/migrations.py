from sqlalchemy import inspect, text


def aplicar_migraciones(engine):
    inspector = inspect(engine)
    if not inspector.has_table("usuarios"):
        return

    columnas_usuarios = {col["name"] for col in inspector.get_columns("usuarios")}
    if "correo" not in columnas_usuarios:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE usuarios ADD COLUMN correo VARCHAR"))

    if not inspector.has_table("productos"):
        return

    columnas_productos = {col["name"] for col in inspector.get_columns("productos")}
    if "proveedor_id" not in columnas_productos:
        with engine.begin() as conn:
            conn.execute(
                text("ALTER TABLE productos ADD COLUMN proveedor_id INTEGER REFERENCES proveedores(id)")
            )
            conn.execute(
                text(
                    """
                    UPDATE productos
                    SET proveedor_id = (
                        SELECT id FROM proveedores ORDER BY id LIMIT 1
                    )
                    WHERE proveedor_id IS NULL
                    AND EXISTS (SELECT 1 FROM proveedores)
                    """
                )
            )
