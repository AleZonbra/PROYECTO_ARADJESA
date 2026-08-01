from sqlalchemy import inspect, text


def _columnas(inspector, tabla: str) -> set[str]:
    if not inspector.has_table(tabla):
        return set()
    return {col["name"] for col in inspector.get_columns(tabla)}


def _agregar_columna(conn, tabla: str, definicion: str):
    conn.execute(text(f"ALTER TABLE {tabla} ADD COLUMN {definicion}"))


def aplicar_migraciones(engine):
    inspector = inspect(engine)

    if inspector.has_table("usuarios"):
        cols = _columnas(inspector, "usuarios")
        if "correo" not in cols:
            with engine.begin() as conn:
                _agregar_columna(conn, "usuarios", "correo VARCHAR")

    if inspector.has_table("productos"):
        cols = _columnas(inspector, "productos")
        with engine.begin() as conn:
            if "proveedor_id" not in cols:
                _agregar_columna(conn, "productos", "proveedor_id INTEGER REFERENCES proveedores(id)")
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
            if "stock_minimo" not in cols:
                _agregar_columna(conn, "productos", "stock_minimo INTEGER DEFAULT 20")
                conn.execute(text("UPDATE productos SET stock_minimo = 20 WHERE stock_minimo IS NULL"))
            if "estado" not in cols:
                _agregar_columna(conn, "productos", "estado VARCHAR DEFAULT 'ACTIVO'")
                conn.execute(text("UPDATE productos SET estado = 'ACTIVO' WHERE estado IS NULL"))

    if inspector.has_table("proveedores"):
        cols = _columnas(inspector, "proveedores")
        with engine.begin() as conn:
            if "rif" not in cols:
                _agregar_columna(conn, "proveedores", "rif VARCHAR")
            if "categoria" not in cols:
                _agregar_columna(conn, "proveedores", "categoria VARCHAR")

    if inspector.has_table("vendedores"):
        cols = _columnas(inspector, "vendedores")
        with engine.begin() as conn:
            if "area_desempeno" not in cols:
                _agregar_columna(conn, "vendedores", "area_desempeno VARCHAR")
                if "trabajos_realizados" in cols:
                    conn.execute(
                        text(
                            """
                            UPDATE vendedores
                            SET area_desempeno = trabajos_realizados
                            WHERE (area_desempeno IS NULL OR area_desempeno = '')
                              AND trabajos_realizados IS NOT NULL
                            """
                        )
                    )
            if "meta_minima" not in cols:
                _agregar_columna(conn, "vendedores", "meta_minima INTEGER DEFAULT 0")
                conn.execute(text("UPDATE vendedores SET meta_minima = 0 WHERE meta_minima IS NULL"))

    if inspector.has_table("clientes"):
        cols = _columnas(inspector, "clientes")
        with engine.begin() as conn:
            if "rif" not in cols:
                _agregar_columna(conn, "clientes", "rif VARCHAR")
            if "zona" not in cols:
                _agregar_columna(conn, "clientes", "zona VARCHAR")
            if "vendedor_id" not in cols:
                _agregar_columna(conn, "clientes", "vendedor_id INTEGER REFERENCES vendedores(id)")
            if "estado" not in cols:
                _agregar_columna(conn, "clientes", "estado VARCHAR DEFAULT 'ACTIVO'")
                conn.execute(text("UPDATE clientes SET estado = 'ACTIVO' WHERE estado IS NULL"))

    if inspector.has_table("movimientos"):
        cols = _columnas(inspector, "movimientos")
        with engine.begin() as conn:
            if "fecha_pedido" not in cols:
                _agregar_columna(conn, "movimientos", "fecha_pedido VARCHAR")
                conn.execute(
                    text(
                        """
                        UPDATE movimientos
                        SET fecha_pedido = fecha_salida
                        WHERE fecha_pedido IS NULL OR fecha_pedido = ''
                        """
                    )
                )
            if "fecha_entrega" not in cols:
                _agregar_columna(conn, "movimientos", "fecha_entrega VARCHAR")
            if "numero_factura" not in cols:
                _agregar_columna(conn, "movimientos", "numero_factura VARCHAR")
            if "estado" not in cols:
                _agregar_columna(conn, "movimientos", "estado VARCHAR DEFAULT 'ACTIVO'")
                conn.execute(text("UPDATE movimientos SET estado = 'ACTIVO' WHERE estado IS NULL"))
