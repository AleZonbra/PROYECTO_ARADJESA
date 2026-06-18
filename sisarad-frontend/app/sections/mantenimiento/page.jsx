"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import apiEndPoin from "../../config/apiEndPointsUrl.json";
import Styles from "./page.module.css";
import dynamic from "next/dynamic";

const ModalRegistrarMantenimiento = dynamic(() => import("./DetalleMantenimiento/modalRegistrarMantenimiento"), { ssr: false });
const ModalMoreInformationMantenimiento = dynamic(() => import("./modalMoreInformationMantenimiento"), { ssr: false });
const ModalInformacionMantenimiento = dynamic(() => import("./DetalleMantenimiento/modalInformacionMantenimiento"), { ssr: false });
const ModalModificarMantenimiento = dynamic(() => import("./modalModificarMantenimiento"), { ssr: false });
import { MantenimientoReport } from "./imprimirMantenimiento/page";
import ModalFinalizarMantenimiento from "./finalizarMantenimiento/page";
import { useUser } from "../../context/UserContext";
import {
    generarPdfMantenimientoDetalle,
    generarPdfMantenimientosGeneral,
} from "../../utils/pdfReports";

export default function Mantenimiento() {
    const { userData } = useUser();
    const userRole = userData?.role;
    const isAdmin = userRole === "administrador";

    const [mantenimientos, setMantenimientos] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;
    const [mantenimientoParaImprimir, setMantenimientoParaImprimir] = useState(null);
    const [isClient, setIsClient] = useState(false);
    const [logoReporte, setLogoReporte] = useState("");

    const fetchMantenimientos = async () => {
        try {
            const response = await axios.get(
                apiEndPoin.mantenimeinto.listarMantenimientos
            );
            setMantenimientos(response.data);
        } catch (error) {
            console.error("Error al obtener los mantenimientos:", error);
        }
    };

const exportToCsv = (mantenimiento) => {
    if (!mantenimiento || !mantenimiento.detallesMantenimiento || mantenimiento.detallesMantenimiento.length === 0) {
        alert("No hay detalles de mantenimiento para exportar.");
        return;
    }

    const DELIMITER = ";"; 
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent = "\uFEFF"; 

    csvContent += ["Repuesto", "Cantidad", "Precio Unitario ($)", "Subtotal ($)"].join(DELIMITER) + "\r\n";

    mantenimiento.detallesMantenimiento.forEach(detalle => {
        const repuestoNombre = detalle.repuesto?.nombre || 'N/A';
        const cantidad = detalle.cantidad;
        const precioUnitario = detalle.repuesto?.precio || 0;
        const subtotal = detalle.costoTotal || 0;

        const safeNombre = `"${repuestoNombre.replace(/"/g, '""')}"`;

        const row = [safeNombre, cantidad, precioUnitario, subtotal];
        csvContent += row.join(DELIMITER) + "\r\n";
    });

    const totalRow = ["Total del Mantenimiento", "", "", mantenimiento.costo || 0];
    csvContent += "\r\n\r\n" + totalRow.join(DELIMITER) + "\r\n";

    const encodedUri = encodeURI(`data:text/csv;charset=utf-8,${csvContent}`);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    
    const placa = mantenimiento.vehiculo?.placa || 'Desconocida';
    link.setAttribute("download", `Detalle_Mantenimiento_${mantenimiento.id}_${placa}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const exportAllToCsv = (data) => {
    if (!data || data.length === 0) {
        alert("No hay datos para exportar.");
        return;
    }
    
    const DELIMITER = ";"; 
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent = "\uFEFF"; 
    
    const headers = [
        "N° de Orden", "Placa", "Tipo de Mantenimiento", "Descripción", 
        "Fecha de Inicio", "Fecha de Culminación", "Kilometraje Actual (Km)", "Total ($)"
    ];
    csvContent += headers.join(DELIMITER) + "\r\n";

    data.forEach(item => {
        const placa = item.vehiculo?.placa || 'N/A';
        const kilometraje = item.vehiculo?.kilometraje?.toLocaleString('es-ES') || 'N/A';
        
        const descripcion = `"${(item.observacion || '').replace(/"/g, '""')}"`; 

        const row = [
            item.id,
            placa,
            item.tipoMantenimiento,
            descripcion,
            item.fecha,
            item.fechaCulminacion,
            kilometraje,
            item.costo || 0
        ];
        csvContent += row.join(DELIMITER) + "\r\n";
    });

    const encodedUri = encodeURI(`data:text/csv;charset=utf-8,${csvContent}`);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Historial_Mantenimiento_General.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
    // ----------------------------------------------------


    const fetchLogoReporte = async () => {
        try {
            const response = await axios.get(apiEndPoin.configuracion.obtenerLogoReporte);
            const base64 = response.data?.logoBase64 || "";
            setLogoReporte(base64 || "");
        } catch (error) {
            console.error("Error al obtener el logo de reporte:", error);
        }
    };

    const handlePrintIndividual = (mantenimiento) => {
        generarPdfMantenimientoDetalle(mantenimiento, logoReporte);
    };

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (userData) {
            fetchMantenimientos();
            fetchLogoReporte();
        }
    }, [userData]);

const handleFinalizar = async (mantenimientoId, fechaCulminacion) => {
        const mantenimiento = mantenimientos.find(
            (m) => m.id === mantenimientoId
        );

        if (!mantenimiento) {
            console.error(
                "Error: Mantenimiento no encontrado para la validación de fecha."
            );
            return;
        }

        const fechaInicio = mantenimiento.fecha;
        const fechaCulminacionDate = new Date(fechaCulminacion);
        const fechaInicioDate = new Date(fechaInicio);

        if (fechaCulminacionDate < fechaInicioDate) {
            alert(
                `¡Error! La fecha de culminación (${fechaCulminacion}) no puede ser anterior a la fecha de inicio del mantenimiento (${fechaInicio}).`
            );
            return; 
        }

        try {
            // Construir la URL base a partir de la configuración para apuntar al backend correcto (onrender)
            const listarUrl = apiEndPoin.mantenimeinto.listarMantenimientos;
            const url = new URL(listarUrl);
            url.pathname = `/mantenimientos/${mantenimientoId}/finalizar`;
            url.search = `?fechaCulminacion=${encodeURIComponent(fechaCulminacion)}`;

            const response = await fetch(url.toString(), {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                console.log("Mantenimiento finalizado con éxito");
                await fetchMantenimientos();
            } else {
                console.error("Error al finalizar el mantenimiento");
                alert("Hubo un error al intentar finalizar el mantenimiento en el servidor.");
            }
        } catch (error) {
            console.error("Error de red:", error);
            alert("Error de red al intentar finalizar el mantenimiento.");
        }
    };

    const handleDelete = async (mantenimientoId) => {
        if (
            !window.confirm(
                `¿Estás seguro de que deseas eliminar el mantenimiento con ID ${mantenimientoId}?`
            )
        ) {
            return;
        }

        try {
            await axios.delete(
                apiEndPoin.mantenimeinto.eliminarMantenimiento.replace(
                    "{mantenimientoId}",
                    mantenimientoId
                )
            );
            alert(`Mantenimiento con ID ${mantenimientoId} eliminado exitosamente.`);
            fetchMantenimientos();
        } catch (error) {
            console.error("Error al eliminar el Mantenimiento:", error);
            alert(`Error al eliminar el Mantenimiento ${mantenimientoId}.`);
        }
    };

    const handlePrint = () => {
        generarPdfMantenimientosGeneral(filteredMantenimientos, logoReporte);
    };

    // LÓGICA DE FILTRADO (sin cambios)
    const filteredMantenimientos = mantenimientos.filter((item) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            item.id.toString().includes(term) ||
            item.vehiculo?.placa?.toLowerCase().includes(term) ||
            item.tipoMantenimiento?.toLowerCase().includes(term) ||
            item.observacion?.toLowerCase().includes(term) ||
            item.fecha?.toLowerCase().includes(term)
        );
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const totalPages = Math.ceil(filteredMantenimientos.length / ITEMS_PER_PAGE) || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedMantenimientos = filteredMantenimientos.slice(
        startIndex,
        startIndex + ITEMS_PER_PAGE
    );

    if (!isClient || !userData) return null;

    return (
        <div
            className={`${Styles.containerMantenimiento} ${
                mantenimientoParaImprimir ? Styles.modeIndividual : Styles.modeGeneral
            }`}
        >
            <h1 className={Styles.tituloParaImprimir}>Vehiculos De Alimenos Amana</h1>
            <h1 className={Styles.title}>Registro de Mantenimiento</h1>

            <p className={Styles.paragraph}>
                Bienvenido a la sección de mantenimiento. Aquí puedes registrar y
                gestionar el mantenimiento de los vehículos.
            </p>

            {isAdmin && (
                <ModalRegistrarMantenimiento
                    onMantenimientoRegistrado={fetchMantenimientos}
                />
            )}

            <div className={Styles.printContainer}>
                <MantenimientoReport mantenimiento={mantenimientoParaImprimir} />
            </div>

            <div className={Styles.listMantenimiento}>
                <div className={Styles.botonYTitulo}>
                    <h2>Historial de Mantenimiento</h2>

                    <div className={Styles.searchContainer}>
                        <input
                            type="text"
                            placeholder="Buscar por Placa, Tipo, Descripción..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    {/* Boton para imprimir - Global */}
                    <button
                        onClick={handlePrint}
                        className={Styles.printButton}
                    >
                        Imprimir Reporte
                        <svg
                            stroke="currentColor"
                            fill="currentColor"
                            strokeWidth="0"
                            viewBox="0 0 24 24"
                            height="1em"
                            width="1em"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"></path>
                        </svg>
                    </button>
                </div>

                {/* Tabla de Mantenimiento */}
                <table className={Styles.tableMantenimiento}>
                    <thead>
                        <tr>
                            <th>N° de Orden</th>
                            <th>Placa</th>
                            <th>Tipo de Mantenimiento</th>
                            <th>Descripcion</th>
                            <th>Fecha de Inicio</th>
                            <th>Fecha de Culminacion</th>
                            <th>Kilometraje actual</th>
                            <th>Total</th>
                            <th className={Styles.noprint}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredMantenimientos.length > 0 ? (
                            paginatedMantenimientos.map((mantenimiento, index) => {
                                const isFinished =
                                    mantenimiento.fechaCulminacion &&
                                    mantenimiento.fechaCulminacion !== "---";

                                return (
                                    <React.Fragment key={mantenimiento.id}>
                                        <tr>
                                            <td>{mantenimiento.id}</td>
                                            <td>{mantenimiento.vehiculo?.placa}</td>
                                            <td>{mantenimiento.tipoMantenimiento}</td>
                                            <td>{mantenimiento.observacion}</td>
                                            <td>{mantenimiento.fecha}</td>
                                            <td>{mantenimiento.fechaCulminacion}</td>
                                            <td>
                                                {mantenimiento.vehiculo?.kilometraje
                                                    ? mantenimiento.vehiculo.kilometraje.toLocaleString(
                                                          "es-ES"
                                                      )
                                                    : "N/A"} Km
                                            </td>
                                            <td>{mantenimiento.costo}$</td>

                                            <td className={Styles.noprint}>
                                                {isAdmin && (
                                                    <>
                                                        <ModalMoreInformationMantenimiento
                                                            mantenimientoId={mantenimiento.id}
                                                            onMantenimientoRegistrado={fetchMantenimientos}
                                                            isFinished={isFinished}
                                                        />

                                                        <button
                                                            className={Styles.buttonDelete}
                                                            onClick={() => handleDelete(mantenimiento.id)}
                                                            disabled={isFinished}
                                                            title={
                                                                isFinished
                                                                    ? "No se puede eliminar un mantenimiento finalizado."
                                                                    : "Eliminar mantenimiento."
                                                            }
                                                            style={{
                                                                opacity: isFinished ? 0.5 : 1,
                                                                cursor: isFinished ? "not-allowed" : "pointer",
                                                            }}
                                                        >
                                                            {/* SVG Delete */}
                                                            <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                                                                <path fill="none" d="M0 0h24v24H0z"></path>
                                                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path>
                                                            </svg>
                                                        </button>

                                                        <ModalModificarMantenimiento
                                                            id={mantenimiento.id}
                                                            onMantenimientoRegistrado={fetchMantenimientos}
                                                            isFinished={isFinished}
                                                        />
                                                        
                                                        {!isFinished ? (
                                                            <ModalFinalizarMantenimiento
                                                                mantenimientoId={mantenimiento.id}
                                                                onFinalizar={handleFinalizar}
                                                            />
                                                        ) : (
                                                            <span
                                                                style={{ color: "green", fontWeight: "bold" }}
                                                            >
                                                                ✅ Finalizado
                                                            </span>
                                                        )}
                                                    </>
                                                )}

                                                <ModalInformacionMantenimiento
                                                    mantenimientoId={mantenimiento.id}
                                                />

                                                {/* Botón de Imprimir Individual */}
                                                <button
                                                    className={Styles.buttonPrint}
                                                    onClick={() => handlePrintIndividual(mantenimiento)}
                                                >
                                                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"></path>
                                                    </svg>
                                                </button>

                                                <br />
                                                
                                                {/* ✅ NUEVO BOTÓN DE EXPORTAR A CSV (EXCEL) */}
                                                <button
                                                    className={Styles.buttonExportCsv}
                                                    onClick={() => exportToCsv(mantenimiento)}
                                                    title="Exportar detalles a CSV"
                                                >
                                                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M19 9h-4V3H9v6H5l7 7 7-7zm-8 2.08V5h2v6.08L14.73 9.4 16 10.87 12 15.11 8 10.87 9.27 9.4 11 11.08zM5 18h14v2H5z"></path>
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                        {mantenimiento.detallesMantenimiento &&
                                            mantenimiento.detallesMantenimiento.length > 0 && (
                                                <tr
                                                    className={Styles.detalleRow}
                                                    key={`detalle-${mantenimiento.id}`}
                                                >
                                                    <td colSpan="9" className={Styles.detalleCell}>
                                                    </td>
                                                </tr>
                                            )}
                                    </React.Fragment>
                                );
                            })
                        ) : (
                            <tr>
                                <td
                                    colSpan="10"
                                    style={{ textAlign: "center", padding: "10px" }}
                                >
                                    No se encontraron mantenimientos.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {filteredMantenimientos.length > 0 && totalPages > 1 && (
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
        </div>
    );
}