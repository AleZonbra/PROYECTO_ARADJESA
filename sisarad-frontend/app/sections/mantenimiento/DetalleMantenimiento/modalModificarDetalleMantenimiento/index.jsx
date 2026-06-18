"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Style from "./page.module.css";
import axios from "axios";
import apiEndPoin from "../../../../config/apiEndPointsUrl.json";

export default function ModaMoreInformationMantenimiento({
  mantenimientoSeleccionado,
  id,
  onMantenimientoRegistrado,
}) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const [allRepuestos, setAllRepuestos] = useState([]);
  const [isLoadingRepuestos, setIsLoadingRepuestos] = useState(false);
  const [codeRepuesto, setCodeRepuesto] = useState(null);
  const [cantidadRepuesto, setCantidadRepuesto] = useState("");
  const [errorRepuesto, setErrorRepuesto] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sugerenciasRepuesto, setSugerenciasRepuesto] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [repuestoSeleccionadoNombre, setRepuestoSeleccionadoNombre] = useState("");
  const [costoTotal, setCostoTotal] = useState("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setMostrarSugerencias(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchAllRepuestos = useCallback(async () => {
    if (allRepuestos.length > 0) return;

    setIsLoadingRepuestos(true);
    const url =
      apiEndPoin.repuestos.listarRepuestos ||
      "http://localhost:8080/repuestos/getAll";

    try {
      const response = await axios.get(url);
      setAllRepuestos(response.data);
    } catch (error) {
      console.error("Error al cargar todos los repuestos:", error);
      alert("Error al cargar la lista de repuestos. Revise el servidor.");
    } finally {
      setIsLoadingRepuestos(false);
    }
  }, [allRepuestos.length]);

  useEffect(() => {
    if (open) {
      fetchAllRepuestos();
    } else {
      ResetForm();
    }
  }, [open, fetchAllRepuestos]);

  const ResetForm = () => {
    setSearchTerm("");
    setCodeRepuesto(null);
    setCantidadRepuesto("");
    setErrorRepuesto("");
    setSugerenciasRepuesto([]);
    setMostrarSugerencias(false);
    setRepuestoSeleccionadoNombre("");
    setCostoTotal("");
  };

  const filterSugerenciasLocal = (fragmento) => {
    if (fragmento.length < 1) {
      setSugerenciasRepuesto([]);
      setMostrarSugerencias(false);
      return;
    }

    const lowerFragment = fragmento.toLowerCase();

    const sugerenciasFiltradas = allRepuestos.filter(
      (repuesto) =>
        repuesto.nombre.toLowerCase().includes(lowerFragment) ||
        String(repuesto.id).includes(lowerFragment)
    );

    setSugerenciasRepuesto(sugerenciasFiltradas);
    setMostrarSugerencias(sugerenciasFiltradas.length > 0);
    setErrorRepuesto("");
  };

  const handleSelectRepuesto = (repuesto) => {
    setCodeRepuesto(repuesto.id);
    setSearchTerm(repuesto.nombre);
    setRepuestoSeleccionadoNombre(repuesto.nombre);
    setMostrarSugerencias(false);
    setErrorRepuesto("");
  };

  function Register(mantenimientoSeleccionado, id, codeRepuesto, cantidadRepuesto) {
    if (!codeRepuesto || codeRepuesto <= 0) {
      setErrorRepuesto("⛔ Por favor, seleccione un repuesto de la lista.");
      alert("Debe seleccionar un repuesto válido de la lista de sugerencias.");
      return;
    }

    if (!cantidadRepuesto || parseInt(cantidadRepuesto) <= 0) {
      setErrorRepuesto("⛔ La cantidad debe ser mayor que cero.");
      alert("La cantidad de repuesto debe ser mayor que cero.");
      return;
    }

    axios
      .put(
        apiEndPoin.detalleMantenimiento.actualizarDetalleMantenimiento.replace("{id}", id),
        {
          id: id,
          mantenimiento: { id: mantenimientoSeleccionado },
          cantidad: cantidadRepuesto,
          repuesto: { id: codeRepuesto },
        }
      )
      .then((response) => {
        alert("Detalle de Mantenimiento modificado exitosamente");
        if (onMantenimientoRegistrado) {
          onMantenimientoRegistrado();
        }
        ResetForm();
        setOpen(false);
      })
      .catch((error) => {
        console.error("Error al modificar el detalle:", error);
        alert("Error al modificar el detalle. Revise la consola.");
      });
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const onSubmit = (e) => {
    e.preventDefault();
    Register(mantenimientoSeleccionado, id, codeRepuesto, cantidadRepuesto);
  };

  if (!isClient) return null;

  return (
    <div className={Style.modalMoreInformationMantenimiento}>
      <button className={Style.openButton} onClick={() => setOpen(true)}>
        <svg
          stroke="currentColor"
          fill="none"
          strokeWidth="2"
          viewBox="0 0 24 24"
          aria-hidden="true"
          height="1em"
          width="1em"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          ></path>
        </svg>
      </button>

      {open && (
        <div
          className={Style.overlay}
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            className={Style.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={Style.closeBtn}
              aria-label="Cerrar"
              onClick={() => setOpen(false)}
            >
              ×
            </button>

            <div className={Style.cardVehiculo}>
              <h2 id="modal-title">Modificar información del mantenimiento</h2>
              <form className={Style.formVehiculo} onSubmit={onSubmit}>
                <label style={{ position: "relative" }} ref={inputRef}>
                  Buscar Repuesto por Nombre o Código
                  <input
                    type="text"
                    name="searchTerm"
                    value={searchTerm}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSearchTerm(value);
                      setCodeRepuesto(null);
                      setRepuestoSeleccionadoNombre("");
                      filterSugerenciasLocal(value);
                    }}
                    onFocus={() => {
                      if (
                        searchTerm.length >= 1 &&
                        sugerenciasRepuesto.length > 0
                      ) {
                        setMostrarSugerencias(true);
                      }
                    }}
                    required
                    autoComplete="off"
                    placeholder={
                      isLoadingRepuestos
                        ? "Cargando repuestos..."
                        : "Escriba para buscar..."
                    }
                    disabled={isLoadingRepuestos}
                  />
                  {mostrarSugerencias && sugerenciasRepuesto.length > 0 && (
                    <ul className={Style.sugerenciasList}>
                      {sugerenciasRepuesto.map((repuesto) => (
                        <li
                          key={repuesto.id}
                          onMouseDown={() => handleSelectRepuesto(repuesto)}
                        >
                          {repuesto.nombre} (ID:
                          {repuesto.id}) -
                          Stock: {repuesto.stock}
                        </li>
                      ))}
                    </ul>
                  )}
                  {codeRepuesto && (
                    <p style={{ fontSize: "0.9em", color: "green", marginTop: "5px" }}>
                      ✅ Seleccionado: **{repuestoSeleccionadoNombre}** (ID: {codeRepuesto})
                    </p>
                  )}
                  {errorRepuesto && (
                    <p style={{ fontSize: "0.9em", color: "red", marginTop: "5px" }}>
                      {errorRepuesto}
                    </p>
                  )}
                </label>

                <label>
                  Cantidad del repuesto
                  <input
                    type="number"
                    name="cantidad"
                    value={cantidadRepuesto}
                    onChange={(e) => setCantidadRepuesto(e.target.value)}
                    required
                    min="1"
                  />
                </label>
                <div className={Style.actions}>
                  <button type="submit" className={Style.submitBtn}>
                    Modificar
                  </button>
                  <button
                    type="button"
                    className={Style.cancelBtn}
                    onClick={() => setOpen(false)}
                  >
                    Cancelar
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
