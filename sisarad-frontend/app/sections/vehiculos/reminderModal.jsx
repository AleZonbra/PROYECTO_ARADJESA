"use client";
import React, { useState } from "react";
import axios from "axios";
import apiEndPoin from "../../config/apiEndPointsUrl.json";
import Style from "./page.module.css";

export default function ReminderModal({ vehiculoId, onSaved }) {
    const [tipo, setTipo] = useState("DISTANCE");
    const [parametroKm, setParametroKm] = useState(10000);
    const [parametroDias, setParametroDias] = useState(180);
    const [descripcion, setDescripcion] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!vehiculoId) { alert('Vehículo no seleccionado'); return; }
        setLoading(true);
        try {
            const showKm = tipo !== "TIME"; // DISTANCE or HYBRID
            const showDays = tipo !== "DISTANCE"; // TIME or HYBRID

            const payload = {
                tipo,
                parametroKm: showKm ? (parametroKm || null) : null,
                parametroDias: showDays ? (parametroDias || null) : null,
                descripcion
            };

            // If using time-based reminder, include the client's current date as the last trigger
            if (showDays) {
                payload.ultimoTriggerFecha = new Date().toISOString();
            }
            const base = (apiEndPoin.reminders && apiEndPoin.reminders.create) || 'https://samva-3m16.onrender.com/reminders/create';
            const url = `${base}?vehiculoId=${vehiculoId}`;
            await axios.post(url, payload);
            if (typeof onSaved === 'function') onSaved();
        } catch (err) {
            console.error(err);
            alert('Error guardando recordatorio');
        } finally { setLoading(false); }
    };

    if (!vehiculoId) return null;

    return (
        <section className={Style.reminderSection}>
            <h3>Crear Recordatorio</h3>
            <form className={Style.reminderForm} onSubmit={handleSubmit}>
                <div className={Style.reminderField}>
                    <label htmlFor="tipo-recordatorio">Tipo</label>
                    <select
                        id="tipo-recordatorio"
                        value={tipo}
                        onChange={(e) => setTipo(e.target.value)}
                    >
                        <option value="DISTANCE">Por Kilómetros</option>
                        <option value="TIME">Por Tiempo</option>
                        <option value="HYBRID">Híbrido</option>
                    </select>
                </div>

                {(tipo === "DISTANCE" || tipo === "HYBRID") && (
                    <div className={Style.reminderField}>
                        <label htmlFor="parametro-km">Parámetro Km (ej. 10000)</label>
                        <input
                            id="parametro-km"
                            type="number"
                            value={parametroKm}
                            onChange={(e) => setParametroKm(parseInt(e.target.value, 10) || 0)}
                        />
                    </div>
                )}

                {(tipo === "TIME" || tipo === "HYBRID") && (
                    <div className={Style.reminderField}>
                        <label htmlFor="parametro-dias">Parámetro Días (ej. 180)</label>
                        <input
                            id="parametro-dias"
                            type="number"
                            value={parametroDias}
                            onChange={(e) => setParametroDias(parseInt(e.target.value, 10) || 0)}
                        />
                    </div>
                )}

                <div className={Style.reminderField}>
                    <label htmlFor="descripcion-recordatorio">Descripción</label>
                    <input
                        id="descripcion-recordatorio"
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                    />
                </div>

                <div className={Style.reminderActions}>
                    <button
                        type="button"
                        className={Style.secondaryButton}
                        onClick={() => {
                            setTipo("DISTANCE");
                            setParametroKm(10000);
                            setParametroDias(180);
                            setDescripcion("");
                        }}
                    >
                        Limpiar
                    </button>
                    <button
                        type="submit"
                        className={Style.primaryButton}
                        disabled={loading}
                    >
                        {loading ? "Guardando..." : "Guardar"}
                    </button>
                </div>
            </form>
        </section>
    );
}
