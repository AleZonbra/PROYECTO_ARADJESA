"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Style from "./page.module.css";
import axios from "axios";
import apiEndPoin from "../../../config/apiEndPointsUrl.json";

export default function ModaMoreInformationMantenimiento({
  mantenimientoId,
  onMantenimientoRegistrado,
  isFinished,
}) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);

  const [allRepuestos, setAllRepuestos] = useState([]);
  const [isLoadingRepuestos, setIsLoadingRepuestos] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [codeRepuesto, setCodeRepuesto] = useState(null);
  const [cantidadRepuesto, setCantidadRepuesto] = useState("");
  const [errorRepuesto, setErrorRepuesto] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sugerenciasRepuesto, setSugerenciasRepuesto] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [repuestoSeleccionadoNombre, setRepuestoSeleccionadoNombre] =
    useState("");

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

  function Register(mantenimientoId, codeRepuesto, cantidadRepuesto) {
    if (!codeRepuesto || codeRepuesto <= 0) {
      setErrorRepuesto("⛔ Por favor, seleccione un repuesto de la lista.");
      alert("Debe seleccionar un repuesto válido de la lista de sugerencias.");
      return;
    }

    axios
      .post(apiEndPoin.detalleMantenimiento.crearDetalleMantenimiento, {
        mantenimiento: { id: mantenimientoId },
        cantidad: cantidadRepuesto,
        repuesto: { id: codeRepuesto },
      })
      .then((response) => {
        console.log("Repuesto registrado:", response.data);
        alert("Repuesto registrado exitosamente");
        if (onMantenimientoRegistrado) {
          onMantenimientoRegistrado();
        }
        ResetForm();
        setOpen(false);
      })
      .catch((error) => {
        let errorMessage =
          "Error al registrar el repuesto. Verifique la conexión o contacte a soporte.";

        if (error.response) {
          const responseData = error.response.data;
          const statusCode = error.response.status;

          if (typeof responseData === "string") {
            errorMessage = responseData;
          } else if (responseData && responseData.message) {
            errorMessage = responseData.message;
          } else if (statusCode === 400) {
            errorMessage =
              "La cantidad solicitada no es válida o excede el stock disponible.";
          } else {
            errorMessage = `Error del servidor (${statusCode}). Revise la consola para detalles.`;
          }
        } else if (error.request) {
          errorMessage = "No se pudo conectar con el servidor.";
        }

        console.error("Error al registrar el repuesto:", error);
        alert(errorMessage);
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
    if (!codeRepuesto) {
      setErrorRepuesto("⛔ Debe seleccionar un repuesto de la lista de sugerencias.");
      alert("Debe seleccionar un repuesto válido de la lista de sugerencias.");
      return;
    }

    if (!cantidadRepuesto || parseInt(cantidadRepuesto) <= 0) {
      setErrorRepuesto("⛔ La cantidad debe ser mayor que cero.");
      alert("La cantidad de repuesto debe ser mayor que cero.");
      return;
    }
    Register(mantenimientoId, codeRepuesto, cantidadRepuesto);
  };

  return (
    <div className={Style.modalMoreInformationMantenimiento}>
      <button
        className={Style.buttonMore}
        onClick={() => setOpen(true)}
        disabled={isFinished}
        title={isFinished ? "Mantenimiento finalizado, no se puede modificar." : "Modificar mantenimiento."}
      >
        Añadir
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
            <button type="button" onClick={() => setOpen(false)} className={Style.closeBtn}>×</button>
            <div className={Style.cardVehiculo}>
              <h2 id="modal-title">Registrar Nueva informacion del mantenimiento</h2>
              <form className={Style.formVehiculo} onSubmit={onSubmit}>
                <label className={Style.hiddenField}>
                  ID de Mantenimiento
                  <input readOnly value={mantenimientoId} />
                </label>

                <label style={{ position: "relative" }} ref={inputRef}>
                  Buscar Repuesto por Nombre o Código
                  <input
                    value={searchTerm}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSearchTerm(value);
                      setCodeRepuesto(null);
                      setRepuestoSeleccionadoNombre("");
                      filterSugerenciasLocal(value);
                    }}
                    onFocus={() => {
                      if (searchTerm.length >= 1 && sugerenciasRepuesto.length > 0) {
                        setMostrarSugerencias(true);
                      }
                    }}
                    placeholder={isLoadingRepuestos ? "Cargando repuestos..." : "Escriba para buscar..."}
                    disabled={isLoadingRepuestos}
                  />
                  {mostrarSugerencias && sugerenciasRepuesto.length > 0 && (
                    <ul className={Style.sugerenciasList}>
                      {sugerenciasRepuesto.map((repuesto) => (
                        <li key={repuesto.id} onMouseDown={() => handleSelectRepuesto(repuesto)}>
                          {repuesto.nombre} (ID:{repuesto.id}) - Stock: {repuesto.stock}
                        </li>
                      ))}
                    </ul>
                  )}

                </label>

                <label>
                  Cantidad del repuesto
                  <input
                    type="number"
                    value={cantidadRepuesto}
                    min="1"
                    onChange={(e) => setCantidadRepuesto(e.target.value)}
                  />
                </label>

                <div className={Style.actions}>
                  <button type="submit" className={Style.submitBtn}>Registrar Mas informacion</button>
                  <button type="button" className={Style.cancelBtn} onClick={() => setOpen(false)}>Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
