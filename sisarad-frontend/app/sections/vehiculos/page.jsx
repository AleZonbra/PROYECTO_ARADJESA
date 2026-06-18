"use client";
import { useUser } from "../../context/UserContext";
import React, { useEffect, useState } from "react";
import Styles from "./page.module.css";
import ModalCreateVehiculo from "./modalCreateVehiculo/page";
import ModalModifiedVehiculo from "./modalModifiedVehiculo/page";
import ModalMoreInformationVehiculo from "./informacionVehiculo/page";
import axios from "axios";
import apiEndPoin from "../../config/apiEndPointsUrl.json";
import {
    generarPdfVehiculoDetalle,
    generarPdfVehiculosGeneral,
} from "../../utils/pdfReports";

export default function Vehiculos() {
    const { userData } = useUser();
    const userRole = userData?.role;
    const isAdmin = userRole === "administrador";

    const [vehiculos, setVehiculos] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;
    const [isClient, setIsClient] = useState(false);
    const [logoReporte, setLogoReporte] = useState("");

    const fetchVehiculos = async () => {
        try {
            setVehiculos([]);
            const response = await axios.get(apiEndPoin.vehiculos.listarVehiculos);
            const data = Array.isArray(response.data) ? response.data : [];
            setVehiculos(data);
        } catch (error) {
            console.error("Error al obtener los vehículos:", error);
            setVehiculos([]);
        }
    };

    const exportVehicleKilometrajeToCsv = (vehiculo) => {
        const historial = vehiculo.historialKilometraje;

        if (!historial || historial.length === 0) {
            alert(`El vehículo con placa ${vehiculo.placa} no tiene historial de kilometraje para exportar.`);
            return;
        }
        
        const DELIMITER = ";"; 
        let csvContent = "";
        csvContent += "\uFEFF"; 

        const headers = ["ID Historial", "Kilometraje (Km)", "Fecha de Registro"];
        csvContent += headers.join(DELIMITER) + "\r\n";

        historial.forEach(item => {
            const row = [
                item.id,
                item.kilometraje ? item.kilometraje.toLocaleString('es-ES') : 'N/A',
                item.fecha || 'N/A'
            ];
            csvContent += row.join(DELIMITER) + "\r\n";
        });

        const encodedUri = encodeURI(`data:text/csv;charset=utf-8,${csvContent}`);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Historial_Kilometraje_${vehiculo.placa}.csv`);
        
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
        let csvContent = "";
        csvContent += "\uFEFF"; 

        const headers = [
            "ID", "Marca", "Modelo", "Año", 
            "Placa", "Kilometraje Actual (Km)"
        ];
        csvContent += headers.join(DELIMITER) + "\r\n";

        data.forEach(item => {
            const kilometraje = item.kilometraje ? item.kilometraje.toLocaleString('es-ES') : 'N/A';
            
            const safeMarca = `"${(item.marca || '').replace(/"/g, '""')}"`;
            const safeModelo = `"${(item.modelo || '').replace(/"/g, '""')}"`;

            const row = [
                item.id,
                safeMarca,
                safeModelo,
                item.anio || 'N/A',
                item.placa || 'N/A',
                kilometraje
            ];
            csvContent += row.join(DELIMITER) + "\r\n";
        });

        const encodedUri = encodeURI(`data:text/csv;charset=utf-8,${csvContent}`);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Inventario_Vehiculos_General.csv`);
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDelete = async (placa) => {
        if (!isAdmin) {
            alert("Permiso denegado. Solo los administradores pueden eliminar vehículos.");
            return;
        }

        if (!window.confirm(`¿Estás seguro de que deseas eliminar el vehículo con placa ${placa}?`)) {
            return;
        }

        try {
            await axios.delete(apiEndPoin.vehiculos.eliminarVehiculo.replace('{placa}', placa));
            alert(`Vehículo con placa ${placa} eliminado exitosamente.`);
            fetchVehiculos();
        } catch (error) {
            console.error("Error al eliminar el vehículo:", error);
            alert(`Error al eliminar el vehículo ${placa}.`);
        }
    };

    const fetchLogoReporte = async () => {
        try {
            const response = await axios.get(apiEndPoin.configuracion.obtenerLogoReporte);
            const base64 = response.data?.logoBase64 || "";
            setLogoReporte(base64 || "");
        } catch (error) {
            console.error("Error al obtener el logo de reporte:", error);
        }
    };

    const handlePrintIndividual = (vehiculo) => {
        generarPdfVehiculoDetalle(vehiculo, logoReporte);
    };

    const handlePrint = () => {
        generarPdfVehiculosGeneral(filteredVehiculos, logoReporte);
    };

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (userData) {
            fetchVehiculos();
            fetchLogoReporte();
        }
    }, [userData]);

    const filteredVehiculos = vehiculos.filter((vehiculo) => {
        if (!searchTerm) return true;

        const term = searchTerm.toLowerCase();

        return (
            vehiculo.marca?.toLowerCase().includes(term) ||
            vehiculo.modelo?.toLowerCase().includes(term) ||
            vehiculo.placa?.toLowerCase().includes(term) ||
            vehiculo.anio?.toString().includes(term)
        );
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const totalPages = Math.ceil(filteredVehiculos.length / ITEMS_PER_PAGE) || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedVehiculos = filteredVehiculos.slice(
        startIndex,
        startIndex + ITEMS_PER_PAGE
    );

    if (!isClient || !userData) return null;

    return (
        <div className={Styles.containerVehiculo}>
            <h1 className={Styles.tituloParaImprimir}>Reporte de Vehículos de Alimentos Amana</h1>
            <h1 className={Styles.title}>Vehículos</h1>
            <p className={Styles.paragraph}>
                Bienvenido a la sección de vehículos. Aquí encontrarás información sobre
                nuestros vehículos disponibles.
            </p>

            {isAdmin && (
                <ModalCreateVehiculo onVehiculoRegistrado={fetchVehiculos} />
            )}

            <div className={Styles.listVehiculo}>
                <div className={Styles.botonYTitulo}>
                    <h2>Lista de Vehículos</h2>

                    <div className={Styles.searchContainer}>
                        <input
                            type="text"
                            placeholder="Buscar placa, marca, modelo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={() => exportAllToCsv(filteredVehiculos)}
                        className={`${Styles.printButton} ${Styles.buttonExportCsvGeneral}`}
                        title="Exportar la lista de vehículos visible a CSV"
                    >
                        Exportar a CSV
                        <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18h14v2H5z"></path>
                        </svg>
                    </button>

                    <button
                        onClick={handlePrint}
                        className={Styles.printButton}
                        title="Imprimir la tabla visible"
                    >
                        Imprimir Reporte
                        <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"></path>
                        </svg>
                    </button>
                </div>

                <table className={Styles.tableVehiculo}>
                    <thead>
                        <tr>
                            <th>Marca</th>
                            <th>Modelo</th>
                            <th>Año</th>
                            <th>Placa</th>
                            <th>Kilometraje</th>
                            <th className={Styles.noprint}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredVehiculos.length > 0 ? (
                            paginatedVehiculos.map((vehiculo, index) => (
                                <tr key={index}>
                                    <td>{vehiculo.marca}</td>
                                    <td>{vehiculo.modelo}</td>
                                    <td>{vehiculo.anio}</td>
                                    <td>{vehiculo.placa}</td>
                                    <td>{vehiculo.kilometraje ? vehiculo.kilometraje.toLocaleString('es-ES') : 'N/A'} Km</td>
                                    <td className={Styles.noprint}>
                                        {isAdmin && (
                                            <>
                                                <button
                                                    className={Styles.buttonDelete}
                                                    onClick={() => handleDelete(vehiculo.placa)}
                                                >
                                                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                                                        <path fill="none" d="M0 0h24v24H0z"></path>
                                                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path>
                                                    </svg>
                                                </button>
                                                <ModalModifiedVehiculo
                                                    id={vehiculo.id}
                                                    placa={vehiculo.placa}
                                                    onVehiculoRegistrado={fetchVehiculos}
                                                />
                                            </>
                                        )}

                                        <ModalMoreInformationVehiculo placa={vehiculo.placa} />

                                        {/* BOTÓN PARA IMPRESIÓN INDIVIDUAL */}
                                        <button
                                            className={Styles.buttonPrint}
                                            onClick={() => handlePrintIndividual(vehiculo)}
                                            title="Imprimir reporte detallado"
                                        >
                                            <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"></path>
                                            </svg>
                                        </button>
                                        
                                        <br />
                                        {/* ✅ BOTÓN DE EXPORTAR KILOMETRAJE (INDIVIDUAL) */}
                                        <button
                                            className={Styles.buttonExportCsv}
                                            onClick={() => exportVehicleKilometrajeToCsv(vehiculo)}
                                            title="Exportar historial de kilometraje a CSV"
                                        >
                                            <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18h14v2H5z"></path>
                                            </svg>
                                        </button>

                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>
                                    {searchTerm
                                        ? "No se encontraron vehículos con ese criterio."
                                        : "No hay vehículos registrados actualmente."}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {filteredVehiculos.length > 0 && totalPages > 1 && (
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