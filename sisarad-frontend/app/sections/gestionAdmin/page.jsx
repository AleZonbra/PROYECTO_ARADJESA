"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useUser } from "../../context/UserContext";
import apiEndPoin from "../../config/apiEndPointsUrl.json"; // Asegúrate de que este archivo contenga el endpoint correcto.
import Styles from "./page.module.css"; // Usa un archivo CSS local para los estilos
import ModalCambiarContrasena from "./modalCambiarContrasena/page"; // Modal para actualizar datos/contraseña
import ModalModificarAdminKey from "./modalModificarAdminKey/page";
import ModalCrearUsuario from "./modalCrearUsuario/page";

export default function GestionContrasenas() {
    const { userData } = useUser();
    const isAdmin = userData?.role === "administrador";

    const [usuarios, setUsuarios] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterActivo, setFilterActivo] = useState("todos");
    const [isClient, setIsClient] = useState(false);
    const [logoPreview, setLogoPreview] = useState("");
    const [isSavingLogo, setIsSavingLogo] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Estado para el usuario que se seleccionará para el cambio de contraseña en el modal
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);

    // 2. NUEVO ESTADO para controlar la visibilidad del modal de la Clave Maestra
    const [isAdminKeyModalOpen, setIsAdminKeyModalOpen] = useState(false);

    // Estado para el modal de creación de usuario
    const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);

    // Función para obtener todos los usuarios (solo si es administrador)
    const fetchUsuarios = async () => {
        if (!isAdmin) return;
        try {
            // Reemplaza 'listarUsuarios' con el endpoint real de tu API para obtener la lista de usuarios.
            const response = await axios.get(apiEndPoin.user.listarUsuarios);
            setUsuarios(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error("Error al obtener la lista de usuarios:", error);
            // Manejo de errores visuales (opcional)
        }
    };

    useEffect(() => {
        setIsClient(true);
    }, []);

    const fetchLogoReporte = async () => {
        try {
            const response = await axios.get(apiEndPoin.configuracion.obtenerLogoReporte);
            const base64 = response.data?.logoBase64 || "";
            setLogoPreview(base64 || "");
        } catch (error) {
            // Si el backend aún no tiene este endpoint (404), simplemente seguimos sin logo
            if (error.response && error.response.status === 404) {
                console.info("Logo de reporte no configurado aún en el backend. Se usará sin logo.");
                setLogoPreview("");
                return;
            }
            console.error("Error al obtener el logo de reporte:", error);
        }
    };

    useEffect(() => {
        if (userData && isAdmin) {
            fetchUsuarios();
            fetchLogoReporte();
        }
    }, [userData, isAdmin]);

    // Lógica de filtrado de usuarios por nombre o email
    const filteredUsuarios = usuarios.filter((user) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            user.nombre?.toLowerCase().includes(term) ||
            user.email?.toLowerCase().includes(term) ||
            user.role?.toLowerCase().includes(term)
        );
    }).filter((user) => {
        if (filterActivo === "todos") return true;
        const isActive = user.activo !== false; // null o true => activo
        if (filterActivo === "activos") return isActive;
        if (filterActivo === "inactivos") return !isActive;
        return true;
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterActivo]);

    const totalPages = Math.ceil(filteredUsuarios.length / ITEMS_PER_PAGE) || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedUsuarios = filteredUsuarios.slice(
        startIndex,
        startIndex + ITEMS_PER_PAGE
    );

    // Función que abre el modal con el usuario seleccionado
    const handleOpenModal = (user) => {
        setUsuarioSeleccionado(user);
    };

    // Función que cierra el modal y recarga la lista
    const handleCloseModal = () => {
        setUsuarioSeleccionado(null);
        fetchUsuarios(); // Recargar la lista para refrescar datos si es necesario
    };

    // 3. FUNCIONES para el nuevo ModalModificarAdminKey
    const handleOpenAdminKeyModal = () => {
        setIsAdminKeyModalOpen(true);
    };

    const handleCloseAdminKeyModal = () => {
        setIsAdminKeyModalOpen(false);
        // No es necesario recargar usuarios, pero podemos mostrar un mensaje de éxito/error si fuera necesario aquí
    };

    const handleOpenCreateUserModal = () => {
        setIsCreateUserModalOpen(true);
    };

    const handleCloseCreateUserModal = (shouldReload = false) => {
        setIsCreateUserModalOpen(false);
        if (shouldReload) {
            fetchUsuarios();
        }
    };

    const handleToggleActivo = async (user) => {
        const nuevoEstado = !(user.activo ?? true);

        if (!window.confirm(`¿Seguro que deseas marcar el usuario ${user.nombre} como ${nuevoEstado ? "ACTIVO" : "INACTIVO"}?`)) {
            return;
        }

        try {
            const url = apiEndPoin.user.actualizarUsuario.replace("{userId}", user.id);
            await axios.put(url, { activo: nuevoEstado });
            await fetchUsuarios();
        } catch (error) {
            console.error("Error al actualizar estado del usuario:", error);
            alert("No se pudo actualizar el estado del usuario.");
        }
    };

    const handleDeleteUsuario = async (user) => {
        if (!window.confirm(`¿Seguro que deseas ELIMINAR al usuario ${user.nombre}? Esta acción no se puede deshacer.`)) {
            return;
        }

        try {
            const url = apiEndPoin.user.deleteUser.replace("{userId}", user.id);
            await axios.delete(url);
            await fetchUsuarios();
        } catch (error) {
            console.error("Error al eliminar usuario:", error);
            alert("No se pudo eliminar el usuario.");
        }
    };

    const handleLogoChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === "string") {
                setLogoPreview(reader.result);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSaveLogo = async () => {
        if (!logoPreview) return;

        try {
            setIsSavingLogo(true);
            await axios.post(apiEndPoin.configuracion.actualizarLogoReporte, {
                logoBase64: logoPreview,
            });
            alert("Logo de reporte actualizado correctamente.");
        } catch (error) {
            console.error("Error al guardar el logo de reporte:", error);
            alert("No se pudo guardar el logo de reporte.");
        } finally {
            setIsSavingLogo(false);
        }
    };
    
    // Si no es cliente o no es administrador, no renderizar nada
    if (!isClient || !isAdmin) {
        return <p className={Styles.accesoDenegado}>Acceso Denegado. Esta sección es solo para Administradores.</p>;
    }


    return (
        <div className={Styles.containerGestion}>
            <h1 className={Styles.title}>🔑 Gestión de Contraseñas de Usuarios</h1>
            <p className={Styles.paragraph}>
                Como administrador, puedes modificar las contraseñas de todos los usuarios, incluyendo la tuya.
            </p>

            <div className={Styles.actionsRow}>
                <button
                    className={Styles.buttonCreateUser}
                    onClick={handleOpenCreateUserModal}
                >
                    ➕ Registrar nuevo usuario
                </button>
            </div>

            <div className={Styles.adminKeySection}>
                <h3>Configuración de Seguridad Maestra</h3>
                <button 
                    className={Styles.buttonAdminKey}
                    onClick={handleOpenAdminKeyModal}
                >
                    🔒 Modificar Clave Maestra de Aplicación
                </button>
            </div>

            <div className={Styles.reportLogoSection}>
                <h3>Configuración de Membrete para Reportes (PDF)</h3>
                <p>
                    Este logo se mostrará en la parte superior de los reportes PDF de vehículos y mantenimientos.
                </p>
                {logoPreview && (
                    <img
                        src={logoPreview}
                        alt="Logo de reporte"
                        className={Styles.reportLogoPreview}
                    />
                )}
                <div className={Styles.reportLogoActions}>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                    />
                    <button
                        type="button"
                        className={Styles.buttonSaveLogo}
                        onClick={handleSaveLogo}
                        disabled={!logoPreview || isSavingLogo}
                    >
                        {isSavingLogo ? "Guardando..." : "Guardar logo"}
                    </button>
                </div>
            </div>

            <div className={Styles.listContainer}>
                <div className={Styles.headerList}>
                    <h2>Usuarios Registrados</h2>
                    <div className={Styles.filtersRow}>
                        <div className={Styles.searchContainer}>
                            <input
                                type="text"
                                placeholder="Buscar por Nombre, Email o Rol..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className={Styles.filterActivo}>
                            <label htmlFor="filterActivo">Estado:</label>
                            <select
                                id="filterActivo"
                                value={filterActivo}
                                onChange={(e) => setFilterActivo(e.target.value)}
                            >
                                <option value="todos">Todos</option>
                                <option value="activos">Solo activos</option>
                                <option value="inactivos">Solo inactivos</option>
                            </select>
                        </div>
                    </div>
                </div>

                <table className={Styles.tableUsuarios}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Apellido</th>
                            <th>Email</th>
                            <th>Rol</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsuarios.length > 0 ? (
                            paginatedUsuarios.map((user) => (
                                <tr key={user.id}>
                                    <td>{user.id}</td>
                                    <td>{user.nombre}</td>
                                    <td>{user.apellido}</td>
                                    <td>{user.email}</td>
                                    <td>{user.role}</td>
                                    <td>
                                        <span
                                            className={`${Styles.estadoBadge} ${user.activo === false ? Styles.estadoInactivo : Styles.estadoActivo}`}
                                        >
                                            {user.activo === false ? "Inactivo" : "Activo"}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            className={Styles.buttonModify}
                                            onClick={() => handleOpenModal(user)}
                                        >
                                            Modificar
                                        </button>
                                        <button
                                            className={Styles.buttonToggle}
                                            onClick={() => handleToggleActivo(user)}
                                        >
                                            {user.activo === false ? "Activar" : "Desactivar"}
                                        </button>
                                        <button
                                            className={Styles.buttonDelete}
                                            onClick={() => handleDeleteUsuario(user)}
                                        >
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>
                                    No se encontraron usuarios.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {filteredUsuarios.length > 0 && totalPages > 1 && (
                    <div className={Styles.pagination}>
                        <button
                            className={Styles.paginationButton}
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        >
                            Anterior
                        </button>
                        {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                            <button
                                key={page}
                                className={
                                    page === currentPage
                                        ? Styles.paginationButtonActive
                                        : Styles.paginationButton
                                }
                                onClick={() => setCurrentPage(page)}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            className={Styles.paginationButton}
                            disabled={currentPage === totalPages}
                            onClick={() =>
                                setCurrentPage((prev) =>
                                    Math.min(prev + 1, totalPages)
                                )
                            }
                        >
                            Siguiente
                        </button>
                    </div>
                )}
            </div>
            
            {/* Modal de Cambio de Contraseña */}
            {usuarioSeleccionado && (
                <ModalCambiarContrasena
                    usuario={usuarioSeleccionado}
                    onClose={handleCloseModal}
                />
            )}

            {/* 5. INTEGRACIÓN DEL NUEVO MODAL DE CLAVE MAESTRA */}
            {isAdminKeyModalOpen && (
                <ModalModificarAdminKey
                    onClose={handleCloseAdminKeyModal}
                />
            )}

            {isCreateUserModalOpen && (
                <ModalCrearUsuario
                    onClose={handleCloseCreateUserModal}
                />
            )}
        </div>
    );
}