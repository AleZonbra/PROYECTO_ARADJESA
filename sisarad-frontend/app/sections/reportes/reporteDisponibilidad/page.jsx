"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import apiEndPoin from "../../../config/apiEndPointsUrl.json";
import Styles from "./page.module.css";

export default function ReporteDisponibilidad() {
    const [mes, setMes] = useState(new Date().getMonth() + 1);
    const [anio, setAnio] = useState(new Date().getFullYear());
    const [datos, setDatos] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const meses = [
        { value: "01", label: "Enero" },
        { value: "02", label: "Febrero" },
        { value: "03", label: "Marzo" },
        { value: "04", label: "Abril" },
        { value: "05", label: "Mayo" },
        { value: "06", label: "Junio" },
        { value: "07", label: "Julio" },
        { value: "08", label: "Agosto" },
        { value: "09", label: "Septiembre" },
        { value: "10", label: "Octubre" },
        { value: "11", label: "Noviembre" },
        { value: "12", label: "Diciembre" },
    ];

    const fetchDisponibilidad = async () => {
        setLoading(true);
        setError(null);
        try {
            const mesFormateado = String(mes).padStart(2, "0");
            const response = await axios.get(
                `${apiEndPoin.reportes.disponibilidadMensual}?mes=${mesFormateado}&anio=${anio}`
            );
            setDatos(response.data);
        } catch (err) {
            console.error("Error al obtener disponibilidad:", err);
            setError("Error al cargar los datos de disponibilidad");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDisponibilidad();
    }, [mes, anio]);

    return (
        <div className={Styles.container}>
            <h2 className={Styles.title}>Reporte de Disponibilidad Mensual</h2>
            <p className={Styles.description}>
                Muestra el porcentaje de vehículos operativos en un mes específico.
            </p>

            <div className={Styles.filters}>
                <div className={Styles.filterGroup}>
                    <label>Mes:</label>
                    <select
                        value={String(mes).padStart(2, "0")}
                        onChange={(e) => setMes(parseInt(e.target.value))}
                    >
                        {meses.map((m) => (
                            <option key={m.value} value={m.value}>
                                {m.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className={Styles.filterGroup}>
                    <label>Año:</label>
                    <input
                        type="number"
                        value={anio}
                        onChange={(e) => setAnio(parseInt(e.target.value))}
                        min="2020"
                        max="2100"
                    />
                </div>
            </div>

            {loading && <div className={Styles.loading}>Cargando...</div>}
            {error && <div className={Styles.error}>{error}</div>}

            {datos && !loading && (
                <div className={Styles.resultado}>
                    <div className={Styles.card}>
                        <h3>
                            {meses.find((m) => m.value === String(mes).padStart(2, "0"))?.label} {anio}
                        </h3>
                        <div className={Styles.metricas}>
                            <div className={Styles.metrica}>
                                <span className={Styles.metricaLabel}>Total Vehículos:</span>
                                <span className={Styles.metricaValue}>{datos.totalVehiculos}</span>
                            </div>
                            <div className={Styles.metrica}>
                                <span className={Styles.metricaLabel}>Vehículos Operativos:</span>
                                <span className={Styles.metricaValue}>{datos.vehiculosOperativos}</span>
                            </div>
                            <div className={Styles.metrica}>
                                <span className={Styles.metricaLabel}>En Mantenimiento:</span>
                                <span className={Styles.metricaValue}>{datos.vehiculosEnMantenimiento}</span>
                            </div>
                            <div className={Styles.metricaPrincipal}>
                                <span className={Styles.metricaLabel}>Disponibilidad:</span>
                                <span className={Styles.metricaValue}>
                                    {datos.porcentajeDisponibilidad.toFixed(2)}%
                                </span>
                            </div>
                        </div>
                        <div className={Styles.resumen}>
                            <p>
                                <strong>{datos.vehiculosOperativos}</strong> de <strong>{datos.totalVehiculos}</strong> vehículos operativos ={" "}
                                <strong>{datos.porcentajeDisponibilidad.toFixed(2)}%</strong> disponibilidad
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
