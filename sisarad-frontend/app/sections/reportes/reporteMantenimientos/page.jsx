"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import apiEndPoin from "../../../config/apiEndPointsUrl.json";
import {
    generarPdfMantenimientoDetalle,
    generarPdfMantenimientosGeneral,
} from "../../../utils/pdfReports";
import Styles from "./page.module.css";

export default function ReporteMantenimientos() {
    const [mantenimientos, setMantenimientos] = useState([]);
    const [mantenimientoSeleccionado, setMantenimientoSeleccionado] = useState(null);
    const [logoReporte, setLogoReporte] = useState("");
    const [loading, setLoading] = useState(false);

    const fetchMantenimientos = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                apiEndPoin.mantenimeinto.listarMantenimientos
            );
            setMantenimientos(response.data);
        } catch (error) {
            console.error("Error al obtener los mantenimientos:", error);
        } finally {
            setLoading(false);
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

    useEffect(() => {
        fetchMantenimientos();
        fetchLogoReporte();
    }, []);

    const handlePrintIndividual = (mantenimiento) => {
        generarPdfMantenimientoDetalle(mantenimiento, logoReporte);
    };

    const handlePrintGeneral = () => {
        if (mantenimientos.length === 0) {
            alert("No hay mantenimientos para imprimir.");
            return;
        }
        generarPdfMantenimientosGeneral(mantenimientos, logoReporte);
    };

    return (
        <div className={Styles.container}>
            <h2 className={Styles.title}>Reportes de Mantenimiento</h2>
            <p className={Styles.description}>
                Genera reportes PDF de mantenimientos individuales o del historial general.
            </p>

            <div className={Styles.actions}>
                <button
                    onClick={handlePrintGeneral}
                    className={Styles.button}
                    disabled={loading || mantenimientos.length === 0}
                >
                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em">
                        <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"></path>
                    </svg>
                    Imprimir Historial General
                </button>
            </div>

            {loading && <div className={Styles.loading}>Cargando mantenimientos...</div>}

            {mantenimientos.length > 0 && (
                <div className={Styles.list}>
                    <h3>Mantenimientos Individuales</h3>
                    <p className={Styles.subtitle}>Selecciona un mantenimiento para generar su reporte detallado:</p>
                    <div className={Styles.tableContainer}>
                        <table className={Styles.table}>
                            <thead>
                                <tr>
                                    <th>Orden</th>
                                    <th>Placa</th>
                                    <th>Tipo</th>
                                    <th>Fecha</th>
                                    <th>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mantenimientos.slice(0, 20).map((mantenimiento) => (
                                    <tr key={mantenimiento.id}>
                                        <td>{mantenimiento.id}</td>
                                        <td>{mantenimiento.vehiculo?.placa || "N/A"}</td>
                                        <td>{mantenimiento.tipoMantenimiento || "N/A"}</td>
                                        <td>{mantenimiento.fecha || "N/A"}</td>
                                        <td>
                                            <button
                                                onClick={() => handlePrintIndividual(mantenimiento)}
                                                className={Styles.buttonSmall}
                                            >
                                                Imprimir
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
