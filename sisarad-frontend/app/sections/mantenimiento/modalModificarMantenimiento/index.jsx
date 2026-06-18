"use client";
import React, { useState, useEffect } from "react";
import Style from "./page.module.css";
import axios from "axios";
import apiEndPoin from "../../../config/apiEndPointsUrl.json";

export default function ModalModificarMantenimiento({
  id,
  onMantenimientoRegistrado,
  isFinished,
}) {
  const resetForm = () => {
    setPlaca("");
    setTipoMantenimiento("");
    setDescripcion("");
    setFecha("");
    setKilometraje("");
  };

  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const onSubmit = (e) => {
    e.preventDefault();

    Register(placa, tipoMantenimiento, descripcion, fecha, kilometraje);
    function Register(
      placa,
      tipoMantenimiento,
      descripcion,
      fecha,
      kilometraje
    ) {
      const vehiculoData = { placa: placa };

      axios
        .put(apiEndPoin.mantenimeinto.actualizarMantenimiento.replace("{id}", id),
          {
            observacion: descripcion,
            fecha: fecha,
            costo: 0,
            tipoMantenimiento: tipoMantenimiento,
            vehiculo: vehiculoData,
          }
        )
      .then((response) => {
        alert("Mantenimiento modificado exitosamente");

        if (onMantenimientoRegistrado) {
          onMantenimientoRegistrado();
        }
        resetForm();
        setOpen(false);
      })
      .catch((error) => {
        alert("Error al modificar el mantenimiento. Revise la consola.");
      });
    }

    setOpen(false);
  };

  const [placa, setPlaca] = useState("");
  const [tipoMantenimiento, setTipoMantenimiento] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState("");
  const [kilometraje, setKilometraje] = useState("");

  return (
    <div className={Style.ModalRegistrarMantenimiento}>
      <button
        className={Style.openButton}
        onClick={() => setOpen(true)}
        disabled={isFinished}
        title={isFinished ? "Mantenimiento finalizado, no se puede modificar." : "Modificar mantenimiento."}
      >
        ✎
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
              <h2 id="modal-title">Modificar Mantenimiento</h2>
              <form className={Style.formVehiculo} onSubmit={onSubmit}>
                <label>
                  Placa del Vehiculo
                  <input
                    type="text"
                    name="placa"
                    value={placa}
                    onChange={(e) => setPlaca(e.target.value)}
                  />
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
                  Descripcion
                  <textarea
                    name="descripcion"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                  />
                </label>

                <label>
                  Fecha de Ingreso
                  <input
                    type="date"
                    name="fecha"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                  />
                </label>

                <div className={Style.actions}>
                  <button type="submit" className={Style.submitBtn}>Modificar Mantenimiento</button>
                  <button
                    type="button"
                    className={Style.cancelBtn}
                    onClick={() => { setOpen(false); resetForm(); }}
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
