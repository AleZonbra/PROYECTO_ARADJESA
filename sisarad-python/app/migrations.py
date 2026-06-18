from sqlalchemy import inspect, text


def aplicar_migraciones(engine):
    inspector = inspect(engine)
    if not inspector.has_table("usuarios"):
        return

    columnas = {col["name"] for col in inspector.get_columns("usuarios")}
    if "correo" not in columnas:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE usuarios ADD COLUMN correo VARCHAR"))
