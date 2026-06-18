"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import apiEndPoin from "../../../config/apiEndPointsUrl.json";
import Styles from "./page.module.css";

export default function PlanificacionPreventiva() {
    const [alertas, setAlertas] = useState([]);
    const [frecuencias, setFrecuencias] = useState([]);
    const [vehiculos, setVehiculos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAlertas();
        fetchFrecuencias();
        fetchVehiculos();
    }, []);

    const fetchAlertas = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(apiEndPoin.planificacionPreventiva.obtenerAlertas);
            setAlertas(response.data);
        } catch (err) {
            console.error("Error al obtener alertas:", err);
            setError("Error al cargar las alertas");
        } finally {
            setLoading(false);
        }
    };

    const fetchFrecuencias = async () => {
        try {
            const response = await axios.get(apiEndPoin.frecuenciasMantenimiento.listarFrecuencias);
            setFrecuencias(response.data);
        } catch (err) {
            console.error("Error al obtener frecuencias:", err);
        }
    };

    const fetchVehiculos = async () => {
        try {
            const response = await axios.get(apiEndPoin.vehiculos.listarVehiculos);
            setVehiculos(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error("Error al obtener vehículos:", err);
        }
    };

    const generarOrden = async (vehiculoId, tipoRevision) => {
        try {
            await axios.post(
                `${apiEndPoin.planificacionPreventiva.generarOrden}?vehiculoId=${vehiculoId}&tipoRevision=${tipoRevision}`
            );
            alert("Orden de servicio generada exitosamente");
            fetchAlertas();
        } catch (err) {
            console.error("Error al generar orden:", err);
            alert("Error al generar la orden de servicio");
        }
    };

    return (
        <div className={Styles.container}>
            <h2 className={Styles.title}>Planificación Preventiva</h2>
            <p className={Styles.description}>
                Sistema de alertas y generación automática de órdenes de mantenimiento preventivo basado en kilometraje.
            </p>

            <div className={Styles.section}>
                <h3>Tabla de Frecuencias por Tipo de Vehículo</h3>
                {frecuencias.length > 0 ? (
                    <table className={Styles.table}>
                        <thead>
                            <tr>
                                <th>Tipo de Vehículo</th>
                                <th>Revisión Básica</th>
                                <th>Revisión Mayor</th>
                                <th>Km Alerta</th>
                            </tr>
                        </thead>
                        <tbody>
                            {frecuencias.map((freq) => (
                                <tr key={freq.id}>
                                    <td>{freq.tipoVehiculo}</td>
                                    <td>Cada {freq.revisionBasicaKm?.toLocaleString("es-ES")} km</td>
                                    <td>Cada {freq.revisionMayorKm?.toLocaleString("es-ES")} km</td>
                                    <td>{freq.kmAlerta || 100} km antes</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className={Styles.empty}>No hay frecuencias configuradas. Contacta al administrador.</p>
                )}
            </div>

            <div className={Styles.section}>
                <h3>Alertas de Mantenimiento Preventivo</h3>
                <button onClick={fetchAlertas} className={Styles.buttonRefresh}>
                    Actualizar Alertas
                </button>

                {loading && <div className={Styles.loading}>Cargando alertas...</div>}
                {error && <div className={Styles.error}>{error}</div>}

                {alertas.length > 0 ? (
                    <div className={Styles.alertas}>
                        {alertas.map((alerta, index) => (
                            <div
                                key={index}
                                className={`${Styles.alerta} ${
                                    alerta.necesitaMantenimiento ? Styles.alertaUrgente : Styles.alertaPreventiva
                                }`}
                            >
                                <div className={Styles.alertaHeader}>
                                    <h4>{alerta.placa} - {alerta.tipoVehiculo}</h4>
                                    <span className={Styles.badge}>
                                        {alerta.tipoRevision}
                                    </span>
                                </div>
                                <div className={Styles.alertaBody}>
                                    <p><strong>Kilometraje actual:</strong> {alerta.kilometrajeActual?.toLocaleString("es-ES")} km</p>
                                    <p><strong>Km recorridos desde último mantenimiento:</strong> {alerta.kmRecorridos?.toLocaleString("es-ES")} km</p>
                                    <p><strong>Límite:</strong> {alerta.kmLimite?.toLocaleString("es-ES")} km</p>
                                    <p><strong>Km restantes:</strong> {alerta.kmRestantes?.toLocaleString("es-ES")} km</p>
                                </div>
                                {alerta.necesitaMantenimiento && (
                                    <div className={Styles.alertaActions}>
                                        <button
                                            onClick={() => generarOrden(alerta.vehiculoId, alerta.tipoRevision)}
                                            className={Styles.buttonGenerar}
                                        >
                                            Generar Orden Automática
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className={Styles.empty}>No hay alertas de mantenimiento preventivo en este momento.</p>
                )}
            </div>
        </div>
    );
}
