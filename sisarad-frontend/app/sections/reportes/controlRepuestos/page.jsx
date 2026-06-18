"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import apiEndPoin from "../../../config/apiEndPointsUrl.json";
import Styles from "./page.module.css";

export default function ControlRepuestos() {
    const [repuestosConStockBajo, setRepuestosConStockBajo] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchRepuestosConStockBajo();
    }, []);

    const fetchRepuestosConStockBajo = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(apiEndPoin.repuestos.alertasStock);
            setRepuestosConStockBajo(response.data);
        } catch (err) {
            console.error("Error al obtener repuestos con stock bajo:", err);
            setError("Error al cargar los repuestos con stock bajo");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={Styles.container}>
            <h2 className={Styles.title}>Control de Repuestos Críticos</h2>
            <p className={Styles.description}>
                Alertas de repuestos con stock por debajo del mínimo configurado. Estos repuestos requieren compra urgente.
            </p>

            <button onClick={fetchRepuestosConStockBajo} className={Styles.buttonRefresh}>
                Actualizar Alertas
            </button>

            {loading && <div className={Styles.loading}>Cargando repuestos...</div>}
            {error && <div className={Styles.error}>{error}</div>}

            {repuestosConStockBajo.length > 0 ? (
                <div className={Styles.resultado}>
                    <table className={Styles.table}>
                        <thead>
                            <tr>
                                <th>Repuesto</th>
                                <th>Stock Actual</th>
                                <th>Stock Mínimo</th>
                                <th>Diferencia</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {repuestosConStockBajo.map((repuesto) => {
                                const diferencia = repuesto.stockMinimo - repuesto.stock;
                                return (
                                    <tr key={repuesto.id}>
                                        <td>{repuesto.nombre}</td>
                                        <td>
                                            <span className={Styles.stockActual}>{repuesto.stock}</span>
                                        </td>
                                        <td>{repuesto.stockMinimo}</td>
                                        <td>
                                            <span className={Styles.diferencia}>-{diferencia}</span>
                                        </td>
                                        <td>
                                            <span className={Styles.badgeUrgente}>REQUIERE COMPRA</span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className={Styles.empty}>
                    <p>✅ Todos los repuestos tienen stock suficiente.</p>
                    <p className={Styles.emptySubtext}>
                        No hay repuestos con stock por debajo del mínimo configurado.
                    </p>
                </div>
            )}
        </div>
    );
}
