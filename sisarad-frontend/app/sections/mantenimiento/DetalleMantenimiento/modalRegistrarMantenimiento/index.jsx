"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import Style from "./page.module.css";
import apiEndPoin from "../../../../config/apiEndPointsUrl.json";

export default function ModalRegistrarMantenimiento({ onMantenimientoRegistrado }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [placa, setPlaca] = useState("");
    const [tipoMantenimiento, setTipoMantenimiento] = useState("");
    const [tipoFalla, setTipoFalla] = useState("");
    const [estado, setEstado] = useState("Pendiente");
    const [descripcion, setDescripcion] = useState("");
    const [fecha, setFecha] = useState("");

    // Listado de vehículos para sugerencias por placa
    const [allVehiculos, setAllVehiculos] = useState([]);
    const [isLoadingVehiculos, setIsLoadingVehiculos] = useState(false);
    const [sugerenciasVehiculo, setSugerenciasVehiculo] = useState([]);
    const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
    const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState(null);
    const inputRef = useRef(null);

    const resetForm = () => {
        setPlaca("");
        setTipoMantenimiento("");
        setTipoFalla("");
        setEstado("Pendiente");
        setDescripcion("");
        setFecha("");
        setSugerenciasVehiculo([]);
        setMostrarSugerencias(false);
        setVehiculoSeleccionado(null);
    };

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape") setOpen(false);
        };
        if (open) window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open]);

    // Cerrar lista de sugerencias al hacer clic fuera del input de placa
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (inputRef.current && !inputRef.current.contains(event.target)) {
                setMostrarSugerencias(false);
            }
        };
        if (open) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [open]);

    const fetchAllVehiculos = useCallback(async () => {
        if (allVehiculos.length > 0) return;

        setIsLoadingVehiculos(true);
        const url = apiEndPoin.vehiculos.listarVehiculos;

        try {
            const response = await axios.get(url);
            setAllVehiculos(response.data || []);
        } catch (error) {
            console.error("Error al cargar los vehículos:", error);
            alert("Error al cargar la lista de vehículos. Revise el servidor.");
        } finally {
            setIsLoadingVehiculos(false);
        }
    }, [allVehiculos.length]);

    // Cuando se abre el modal, cargamos la lista de vehículos una vez
    useEffect(() => {
        if (open) {
            fetchAllVehiculos();
        }
    }, [open, fetchAllVehiculos]);

    const filterSugerenciasLocal = (fragmento) => {
        if (!fragmento || fragmento.length < 1) {
            setSugerenciasVehiculo([]);
            setMostrarSugerencias(false);
            return;
        }

        const lower = fragmento.toLowerCase();

        const sugerenciasFiltradas = allVehiculos.filter((vehiculo) => {
            const placaV = (vehiculo.placa || "").toLowerCase();
            const marcaV = (vehiculo.marca || "").toLowerCase();
            const modeloV = (vehiculo.modelo || "").toLowerCase();
            return (
                placaV.includes(lower) ||
                marcaV.includes(lower) ||
                modeloV.includes(lower)
            );
        });

        setSugerenciasVehiculo(sugerenciasFiltradas);
        setMostrarSugerencias(sugerenciasFiltradas.length > 0);
    };

    const handleSelectVehiculo = (vehiculo) => {
        setPlaca(vehiculo.placa || "");
        setVehiculoSeleccionado(vehiculo);
        setSugerenciasVehiculo([]);
        setMostrarSugerencias(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!placa || !tipoMantenimiento || !fecha) {
            alert("Por favor completa al menos Placa, Tipo de mantenimiento y Fecha.");
            return;
        }

        setLoading(true);
        try {
            const vehiculoData = vehiculoSeleccionado
                ? { placa: vehiculoSeleccionado.placa, kilometraje: vehiculoSeleccionado.kilometraje }
                : { placa };

            await axios.post(apiEndPoin.mantenimeinto.crearMantenimiento, {
                observacion: descripcion,
                fecha,
                costo: 0,
                tipoMantenimiento,
                tipoFalla: tipoFalla || null,
                estado: estado || "Pendiente",
                vehiculo: vehiculoData,
            });

            alert("Mantenimiento registrado exitosamente");
            if (typeof onMantenimientoRegistrado === "function") {
                onMantenimientoRegistrado();
            }
            resetForm();
            setOpen(false);
        } catch (err) {
            console.error(err);
            alert("Error registrando mantenimiento. Revise el servidor.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={Style.ModalRegistrarMantenimiento}>
            <button
                className={Style.openButton}
                onClick={() => setOpen(true)}
            >
                Registrar Nuevo Mantenimiento
            </button>

            {open && (
                <div className={Style.overlay} onClick={() => setOpen(false)}>
                    <div
                        className={Style.modal}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="modal-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className={Style.closeBtn}
                        >
                            ✕
                        </button>

                        <div className={Style.cardVehiculo}>
                            <h2 id="modal-title">Registrar Nuevo Mantenimiento</h2>

                            <form className={Style.formVehiculo} onSubmit={handleSubmit}>
                                <label style={{ position: "relative" }} ref={inputRef}>
                                    Placa del Vehículo
                                    <input
                                        type="text"
                                        name="placa"
                                        value={placa}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setPlaca(value);
                                            setVehiculoSeleccionado(null);
                                            filterSugerenciasLocal(value);
                                        }}
                                        onFocus={() => {
                                            if (placa.length >= 1 && sugerenciasVehiculo.length > 0) {
                                                setMostrarSugerencias(true);
                                            }
                                        }}
                                        placeholder={
                                            isLoadingVehiculos
                                                ? "Cargando vehículos..."
                                                : "Escribe placa, marca o modelo..."
                                        }
                                        autoComplete="off"
                                    />
                                    {mostrarSugerencias && sugerenciasVehiculo.length > 0 && (
                                        <ul className={Style.sugerenciasList}>
                                            {sugerenciasVehiculo.map((vehiculo) => (
                                                <li
                                                    key={vehiculo.id}
                                                    onMouseDown={() => handleSelectVehiculo(vehiculo)}
                                                >
                                                    {vehiculo.placa} - {vehiculo.marca} {vehiculo.modelo} (
                                                    KM: {vehiculo.kilometraje ?? "N/D"})
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    {vehiculoSeleccionado && (
                                        <p className={Style.kmActual}>
                                            Vehículo seleccionado: {vehiculoSeleccionado.marca} {" "}
                                            {vehiculoSeleccionado.modelo} - Placa {vehiculoSeleccionado.placa}
                                            {typeof vehiculoSeleccionado.kilometraje === "number" && (
                                                <>
                                                    {" "}- KM actual: {vehiculoSeleccionado.kilometraje.toLocaleString("es-ES")} km
                                                </>
                                            )}
                                        </p>
                                    )}
                                </label>

                                <label>
                                    Tipo de Mantenimiento
                                    <input
                                        type="text"
                                        name="tipoMantenimiento"
                                        value={tipoMantenimiento}
                                        onChange={(e) => setTipoMantenimiento(e.target.value)}
                                    />
                                </label>

                                <label>
                                    Tipo de Falla
                                    <select
                                        name="tipoFalla"
                                        value={tipoFalla}
                                        onChange={(e) => setTipoFalla(e.target.value)}
                                    >
                                        <option value="">Seleccione un tipo...</option>
                                        <option value="Frenos">Frenos</option>
                                        <option value="Motor">Motor</option>
                                        <option value="Eléctrico">Eléctrico</option>
                                        <option value="Neumáticos">Neumáticos</option>
                                        <option value="Refrigeración">Refrigeración</option>
                                        <option value="Otros">Otros</option>
                                    </select>
                                </label>

                                <label>
                                    Estado
                                    <select
                                        name="estado"
                                        value={estado}
                                        onChange={(e) => setEstado(e.target.value)}
                                    >
                                        <option value="Pendiente">Pendiente</option>
                                        <option value="En Proceso">En Proceso</option>
                                        <option value="Completado">Completado</option>
                                    </select>
                                </label>

                                <label>
                                    Descripción
                                    <textarea
                                        name="descripcion"
                                        value={descripcion}
                                        onChange={(e) => setDescripcion(e.target.value)}
                                        style={{ marginTop: "6px", padding: "8px 10px", borderRadius: "6px", border: "1px solid #ccc", minHeight: "60px" }}
                                    />
                                </label>

                                <label>
                                    Fecha de Inicio
                                    <input
                                        type="date"
                                        name="fecha"
                                        value={fecha}
                                        onChange={(e) => setFecha(e.target.value)}
                                    />
                                </label>

                                <div className={Style.actions}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            resetForm();
                                            setOpen(false);
                                        }}
                                        className={Style.cancelBtn}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className={Style.submitBtn}
                                    >
                                        {loading ? "Guardando..." : "Registrar"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
