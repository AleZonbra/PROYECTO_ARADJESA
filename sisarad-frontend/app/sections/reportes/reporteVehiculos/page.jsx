"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import apiEndPoin from "../../../config/apiEndPointsUrl.json";
import {
    generarPdfVehiculoDetalle,
    generarPdfVehiculosGeneral,
} from "../../../utils/pdfReports";
import Styles from "./page.module.css";

export default function ReporteVehiculos() {
    const [vehiculos, setVehiculos] = useState([]);
    const [logoReporte, setLogoReporte] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchVehiculos();
        fetchLogoReporte();
    }, []);

    const fetchVehiculos = async () => {
        setLoading(true);
        try {
            const response = await axios.get(apiEndPoin.vehiculos.listarVehiculos);
            setVehiculos(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error("Error al obtener los vehículos:", error);
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

    const handlePrintGeneral = () => {
        if (vehiculos.length === 0) {
            alert("No hay vehículos para imprimir.");
            return;
        }
        generarPdfVehiculosGeneral(vehiculos, logoReporte);
    };

    const handlePrintIndividual = (vehiculo) => {
        generarPdfVehiculoDetalle(vehiculo, logoReporte);
    };

    return (
        <div className={Styles.container}>
            <h2 className={Styles.title}>Reportes de Vehículos</h2>
            <p className={Styles.description}>
                Genera reportes PDF del inventario general o de vehículos individuales.
            </p>

            <div className={Styles.actions}>
                <button onClick={handlePrintGeneral} className={Styles.button} disabled={loading || vehiculos.length === 0}>
                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em">
                        <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"></path>
                    </svg>
                    Imprimir Inventario General
                </button>
            </div>

            {loading && <div className={Styles.loading}>Cargando vehículos...</div>}

            {vehiculos.length > 0 && (
                <div className={Styles.list}>
                    <h3>Vehículos Individuales</h3>
                    <div className={Styles.tableContainer}>
                        <table className={Styles.table}>
                            <thead>
                                <tr>
                                    <th>Placa</th>
                                    <th>Marca</th>
                                    <th>Modelo</th>
                                    <th>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vehiculos.slice(0, 20).map((vehiculo) => (
                                    <tr key={vehiculo.id}>
                                        <td>{vehiculo.placa}</td>
                                        <td>{vehiculo.marca}</td>
                                        <td>{vehiculo.modelo}</td>
                                        <td>
                                            <button onClick={() => handlePrintIndividual(vehiculo)} className={Styles.buttonSmall}>
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
