ADMINISTRADOR_SISTEMA = "administrador_sistema"
ENCARGADO_NEGOCIO = "encargado_negocio"

ROLE_LABELS = {
    ADMINISTRADOR_SISTEMA: "Administrador del Sistema",
    ENCARGADO_NEGOCIO: "Encargado de Negocio",
}

MODULOS_POR_ROL = {
    ADMINISTRADOR_SISTEMA: [
        "inicio",
        "productos",
        "vendedores",
        "proveedores",
        "clientes",
        "despachos",
        "usuarios",
        "mi_cuenta",
    ],
    ENCARGADO_NEGOCIO: [
        "inicio",
        "productos",
        "clientes",
        "despachos",
        "mi_cuenta",
    ],
}


ROLE_ALIASES = {
    "administrador": ADMINISTRADOR_SISTEMA,
}


def normalizar_rol(role: str | None) -> str | None:
    if not role:
        return None
    return ROLE_ALIASES.get(role, role)


def etiqueta_rol(role: str) -> str:
    return ROLE_LABELS.get(normalizar_rol(role) or role, role)


def modulos_para_rol(role: str | None) -> list[str]:
    if not role:
        return []
    return MODULOS_POR_ROL.get(normalizar_rol(role), [])


def puede_acceder_modulo(role: str | None, modulo: str) -> bool:
    return modulo in modulos_para_rol(role)


def es_administrador_sistema(role: str | None) -> bool:
    return normalizar_rol(role) == ADMINISTRADOR_SISTEMA
