"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import apiEndPoin from "../../../config/apiEndPointsUrl.json";
import { generarPdfRepuestosGeneral } from "../../../utils/pdfReports";
import Styles from "./page.module.css";

export default function ReporteRepuestos() {
    const [repuestos, setRepuestos] = useState([]);
    const [logoReporte, setLogoReporte] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchRepuestos();
        fetchLogoReporte();
    }, []);

    const fetchRepuestos = async () => {
        setLoading(true);
        try {
            const response = await axios.get(apiEndPoin.repuestos.listarRepuestos);
            setRepuestos(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error("Error al obtener los repuestos:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchLogoReporte = async () => {
        try {
            const response = await axios.get(apiEndPoin.configuracion.obtenerLogoReporte);
            setLogoReporte(response.data?.logoBase64 || "");
        } catch (error) {
            console.error("Error al obtener el logo de reporte:", error);
        }
    };

    const handlePrint = () => {
        if (repuestos.length === 0) {
            alert("No hay repuestos para imprimir.");
            return;
        }
        generarPdfRepuestosGeneral(repuestos, logoReporte);
    };

    return (
        <div className={Styles.container}>
            <h2 className={Styles.title}>Reportes de Repuestos</h2>
            <p className={Styles.description}>
                Genera un reporte PDF del inventario completo de repuestos.
            </p>

            <div className={Styles.actions}>
                <button onClick={handlePrint} className={Styles.button} disabled={loading || repuestos.length === 0}>
                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em">
                        <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"></path>
                    </svg>
                    Imprimir Inventario de Repuestos
                </button>
            </div>

            {loading && <div className={Styles.loading}>Cargando repuestos...</div>}

            {repuestos.length > 0 && (
                <div className={Styles.info}>
                    <p>Total de repuestos en inventario: <strong>{repuestos.length}</strong></p>
                </div>
            )}
        </div>
    );
}
