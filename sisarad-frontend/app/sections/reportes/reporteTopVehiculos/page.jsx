"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import apiEndPoin from "../../../config/apiEndPointsUrl.json";
import Styles from "./page.module.css";

export default function ReporteTopVehiculos() {
    const [meses, setMeses] = useState(3);
    const [datos, setDatos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchTopVehiculos = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(
                `${apiEndPoin.reportes.topVehiculos}?meses=${meses}`
            );
            setDatos(response.data);
        } catch (err) {
            console.error("Error al obtener top vehículos:", err);
            setError("Error al cargar los datos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTopVehiculos();
    }, [meses]);

    return (
        <div className={Styles.container}>
            <h2 className={Styles.title}>Top 3 Vehículos con Más Reparaciones</h2>
            <p className={Styles.description}>
                Muestra los vehículos que han requerido más mantenimientos en los últimos meses.
            </p>

            <div className={Styles.filters}>
                <div className={Styles.filterGroup}>
                    <label>Período (meses):</label>
                    <select
                        value={meses}
                        onChange={(e) => setMeses(parseInt(e.target.value))}
                    >
                        <option value="1">Último mes</option>
                        <option value="3">Últimos 3 meses</option>
                        <option value="6">Últimos 6 meses</option>
                        <option value="12">Último año</option>
                    </select>
                </div>
            </div>

            {loading && <div className={Styles.loading}>Cargando...</div>}
            {error && <div className={Styles.error}>{error}</div>}

            {datos.length > 0 && !loading && (
                <div className={Styles.resultado}>
                    <table className={Styles.table}>
                        <thead>
                            <tr>
                                <th>Posición</th>
                                <th>Placa</th>
                                <th>Marca</th>
                                <th>Modelo</th>
                                <th>Reparaciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {datos.map((vehiculo, index) => (
                                <tr key={vehiculo.vehiculoId}>
                                    <td>
                                        <span className={Styles.badge}>
                                            #{index + 1}
                                        </span>
                                    </td>
                                    <td>{vehiculo.placa}</td>
                                    <td>{vehiculo.marca}</td>
                                    <td>{vehiculo.modelo}</td>
                                    <td>
                                        <strong>{vehiculo.cantidadReparaciones}</strong> en {vehiculo.meses} meses
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {datos.length === 0 && !loading && !error && (
                <div className={Styles.empty}>
                    No hay datos disponibles para el período seleccionado.
                </div>
            )}
        </div>
    );
}
