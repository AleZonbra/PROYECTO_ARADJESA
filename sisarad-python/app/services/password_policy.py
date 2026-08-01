import re

MIN_LENGTH = 8


def validar_contrasena(clave: str) -> str | None:
    """Valida política de contraseña. Devuelve mensaje de error o None si es válida."""
    valor = (clave or "").strip()
    if not valor:
        return "La contraseña es obligatoria"
    if len(valor) < MIN_LENGTH:
        return f"La contraseña debe tener al menos {MIN_LENGTH} caracteres"
    if not re.search(r"[A-ZÁÉÍÓÚÑ]", valor):
        return "La contraseña debe incluir al menos una letra mayúscula"
    if not re.search(r"[a-záéíóúñ]", valor):
        return "La contraseña debe incluir al menos una letra minúscula"
    if not re.search(r"\d", valor):
        return "La contraseña debe incluir al menos un número"
    if not re.search(r"[^A-Za-zÁÉÍÓÚáéíóúÑñ0-9]", valor):
        return "La contraseña debe incluir al menos un carácter especial"
    return None


def requisitos_texto() -> str:
    return (
        f"Mínimo {MIN_LENGTH} caracteres, con mayúscula, minúscula, número y carácter especial."
    )
