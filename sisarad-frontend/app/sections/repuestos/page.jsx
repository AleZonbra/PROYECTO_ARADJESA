"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import apiEndPoin from "../../config/apiEndPointsUrl.json";
import Styles from "./page.module.css";
import ModalRegistrarRepuesto from "./modalCreateRepuestos/page";
import ModalModifiedRepuesto from "./modalModifiedRepuestos/page";
import { useUser } from "../../context/UserContext";
import { generarPdfRepuestosGeneral } from "../../utils/pdfReports";

export default function Repuestos() {
    const { userData } = useUser();
    const userRole = userData?.role;
    const isAdmin = userRole === "administrador"; 

    const [repuestos, setRepuestos] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isClient, setIsClient] = useState(false);
    const [logoReporte, setLogoReporte] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const fetchRepuestos = async () => {
        try {
            const response = await axios.get(apiEndPoin.repuestos.listarRepuestos);
            const data = Array.isArray(response.data) ? response.data : [];
            setRepuestos(data);
        } catch (error) {
            console.error("Error al obtener los repuestos:", error);
            setRepuestos([]);
        }
    };

    const exportAllToCsv = (data) => {
        if (!data || data.length === 0) {
            alert("No hay datos para exportar.");
            return;
        }
        
        const DELIMITER = ";"; 
        
        let csvContent = "";
        csvContent += "\uFEFF"; 

        const headers = ["Id de Repuestos", "Nombre", "Precio ($)", "Cantidad (Stock)"];
        csvContent += headers.join(DELIMITER) + "\r\n";

        data.forEach(item => {
            const safeNombre = `"${(item.nombre || '').replace(/"/g, '""')}"`;

            const row = [
                item.id,
                safeNombre,
                item.precio || 0,
                item.stock || 0
            ];
            csvContent += row.join(DELIMITER) + "\r\n";
        });

        const encodedUri = encodeURI(`data:text/csv;charset=utf-8,${csvContent}`);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Historial_Repuestos_General.csv`);
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        setIsClient(true);
    }, []);

    const fetchLogoReporte = async () => {
        try {
            const response = await axios.get(apiEndPoin.configuracion.obtenerLogoReporte);
            const base64 = response.data?.logoBase64 || "";
            setLogoReporte(base64 || "");
        } catch (error) {
            // Si el endpoint aún no existe en backend remoto, simplemente seguimos sin logo
            if (error.response && error.response.status === 404) {
                console.info("Logo de reporte no configurado aún en el backend (repuestos). Se usará sin logo.");
                setLogoReporte("");
                return;
            }
            console.error("Error al obtener el logo de reporte para repuestos:", error);
        }
    };

    useEffect(() => {
        if (userData) {
            fetchRepuestos();
            fetchLogoReporte();
        }
    }, [userData]);

    const filteredRepuestos = repuestos.filter((item) => {
        if (!searchTerm) return true;

        const term = searchTerm.toLowerCase();

        return (
            item.id.toString().includes(term) || 
            item.nombre?.toLowerCase().includes(term)
        );
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const totalPages = Math.ceil(filteredRepuestos.length / ITEMS_PER_PAGE) || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedRepuestos = filteredRepuestos.slice(
        startIndex,
        startIndex + ITEMS_PER_PAGE
    );

    if (!isClient || !userData) return null;

    const handleDelete = async (repuestoId) => {
        if (!isAdmin) {
            alert("Permiso denegado. Solo los administradores pueden eliminar repuestos.");
            return;
        }
        
        if (!window.confirm(`¿Estás seguro de que deseas eliminar el repuesto con ID ${repuestoId}?`)) {
            return;
        }
        try {
            await axios.delete(
                apiEndPoin.repuestos.eliminarRepuesto.replace("{repuestoId}", repuestoId)
            );
            alert(`Repuesto con ID ${repuestoId} eliminado exitosamente.`);
            fetchRepuestos();
        } catch (error) {
            console.error("Error al eliminar el repuesto:", error);
            alert(`Error al eliminar el repuesto ${repuestoId}.`);
        }
    };

    const handlePrint = () => {
        if (!filteredRepuestos.length) {
            alert("No hay repuestos para imprimir.");
            return;
        }

        generarPdfRepuestosGeneral(filteredRepuestos, logoReporte);
    };

    return (
        <div className={Styles.containerRepuestos}>   
            <h1 className={Styles.tituloParaImprimir}>Repuestos</h1>
            <h1 className={Styles.tituloRepuestos}>Registro de Repuestos</h1>
            <p className={Styles.paragraph}>
                Bienvenido a la sección de repuestos. Aquí puedes registrar y gestionar
                los repuestos de los vehículos.
            </p>
            
            {isAdmin && (
                <ModalRegistrarRepuesto onRepuestoRegistrado={fetchRepuestos} />
            )}
            
            <div className={Styles.listRepuestos}>
                <div className={Styles.botonYTitulo}>
                    <h2>Historial de Repuestos</h2>
                    
                    <div className={Styles.searchContainer}>
                        <input
                            type="text"
                            placeholder="Buscar por Nombre o ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={() => exportAllToCsv(filteredRepuestos)}
                        className={`${Styles.printButton} ${Styles.buttonExportCsvGeneral}`}
                        title="Exportar todo el historial visible a CSV"
                    >
                        Exportar a CSV
                        <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18h14v2H5z"></path>
                        </svg>
                    </button>

                    <button
                        onClick={handlePrint}
                        className={Styles.printButton}
                    >
                        Imprimir Reporte
                        <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"></path>
                        </svg>
                    </button>
                </div>

                <table className={Styles.tableRepuestos}>
                    <thead>
                        <tr>
                            <th>Id de Repuestos</th>
                            <th>Nombre</th>
                            <th>Precio</th>
                            <th>Cantidad</th>
                            {isAdmin && <th className={Styles.noprint}>Acciones</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRepuestos.length > 0 ? (
                            paginatedRepuestos.map((repuesto, index) => (
                                <tr key={index}>
                                    <td>{repuesto.id}</td>
                                    <td>{repuesto.nombre}</td>
                                    <td>{repuesto.precio}$</td>
                                    <td>{repuesto.stock}</td>
                                    {isAdmin && (
                                        <td className={Styles.noprint}>
                                            <button
                                                className={Styles.buttonDelete}
                                                onClick={() => handleDelete(repuesto.id)}
                                            >
                                                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                                                    <path fill="none" d="M0 0h24v24H0z"></path>
                                                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path>
                                                </svg>
                                            </button>
                                            <ModalModifiedRepuesto
                                                id={repuesto.id}
                                                onRepuestoRegistrado={fetchRepuestos}
                                            />
                                        </td>
                                    )}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={isAdmin ? "5" : "4"} style={{ textAlign: "center", padding: "20px" }}>
                                    {searchTerm 
                                        ? "No se encontraron repuestos con ese criterio." 
                                        : "No hay repuestos actualmente."}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {filteredRepuestos.length > 0 && totalPages > 1 && (
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