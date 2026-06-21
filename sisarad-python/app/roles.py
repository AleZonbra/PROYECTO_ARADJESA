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
        "vendedores",
        "proveedores",
        "clientes",
        "despachos",
        "mi_cuenta",
    ],
}

PERMISOS_CRUD_POR_ROL = {
    ADMINISTRADOR_SISTEMA: {
        "crear": True,
        "editar": True,
        "eliminar": True,
    },
    ENCARGADO_NEGOCIO: {
        "crear": True,
        "editar": False,
        "eliminar": False,
    },
}

ROLE_ALIASES = {
    "administrador": ADMINISTRADOR_SISTEMA,
    "administrador_sistema": ADMINISTRADOR_SISTEMA,
    "admin": ADMINISTRADOR_SISTEMA,
    "encargado": ENCARGADO_NEGOCIO,
    "encargado_negocio": ENCARGADO_NEGOCIO,
}

MODULOS_CON_REPORTE = frozenset({"productos", "despachos"})

NAV_ITEMS = [
    ("inicio", "/inicio"),
    ("productos", "/productos"),
    ("vendedores", "/vendedores"),
    ("proveedores", "/proveedores"),
    ("clientes", "/clientes"),
    ("despachos", "/despachos"),
    ("usuarios", "/usuarios"),
    ("mi_cuenta", "/mi-cuenta"),
]

ETIQUETAS_MODULO = {
    "inicio": "Inicio",
    "productos": "Inventario",
    "vendedores": "Vendedores",
    "proveedores": "Proveedores",
    "clientes": "Clientes",
    "despachos": "Despachos",
    "usuarios": "Usuarios",
    "mi_cuenta": "Mi cuenta",
}


def normalizar_rol(role: str | None) -> str | None:
    if not role:
        return None

    limpio = role.strip()
    if not limpio:
        return None

    if limpio in MODULOS_POR_ROL:
        return limpio

    if limpio in ROLE_ALIASES:
        return ROLE_ALIASES[limpio]

    clave = limpio.lower().replace(" ", "_").replace("-", "_")
    if clave in MODULOS_POR_ROL:
        return clave
    if clave in ROLE_ALIASES:
        return ROLE_ALIASES[clave]

    if "encargado" in clave:
        return ENCARGADO_NEGOCIO
    if "administrador" in clave or clave == "admin":
        return ADMINISTRADOR_SISTEMA

    return None


def etiqueta_rol(role: str) -> str:
    return ROLE_LABELS.get(normalizar_rol(role) or role, role)


def modulos_para_rol(role: str | None) -> list[str]:
    rol = normalizar_rol(role)
    if not rol:
        return []
    return MODULOS_POR_ROL.get(rol, [])


def items_menu_para_rol(role: str | None) -> list[dict[str, str]]:
    permitidos = set(modulos_para_rol(role))
    items = []
    for modulo, ruta in NAV_ITEMS:
        if modulo in permitidos:
            items.append(
                {
                    "modulo": modulo,
                    "ruta": ruta,
                    "etiqueta": etiqueta_modulo(modulo),
                }
            )
    return items


def permisos_crud(role: str | None) -> dict[str, bool]:
    rol = normalizar_rol(role)
    if not rol:
        return {"crear": False, "editar": False, "eliminar": False}
    return PERMISOS_CRUD_POR_ROL.get(
        rol,
        {"crear": False, "editar": False, "eliminar": False},
    )


def puede_acceder_modulo(role: str | None, modulo: str) -> bool:
    return modulo in modulos_para_rol(role)


def puede_generar_reporte(role: str | None, modulo: str) -> bool:
    return modulo in MODULOS_CON_REPORTE and puede_acceder_modulo(role, modulo)


def etiqueta_modulo(modulo: str) -> str:
    return ETIQUETAS_MODULO.get(modulo, modulo.replace("_", " ").title())


def puede_crear(role: str | None) -> bool:
    return permisos_crud(role)["crear"]


def puede_editar(role: str | None) -> bool:
    return permisos_crud(role)["editar"]


def puede_eliminar(role: str | None) -> bool:
    return permisos_crud(role)["eliminar"]


def es_administrador_sistema(role: str | None) -> bool:
    return normalizar_rol(role) == ADMINISTRADOR_SISTEMA
