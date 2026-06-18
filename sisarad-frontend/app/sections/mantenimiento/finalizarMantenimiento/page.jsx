// ModalFinalizarMantenimiento.jsx
"use client";
import React, { useState, useEffect, userData } from "react";
import Styles from "./page.module.css"; 

export default function ModalFinalizarMantenimiento({
  mantenimientoId,
  onFinalizar, // Función que se ejecuta al enviar
}) {
  const [open, setOpen] = useState(false);
  const [fechaCulminacion, setFechaCulminacion] = useState("");
const [maxDate, setMaxDate] = useState(""); 

  const handleOpen = () => {
    // 1. Calcular la fecha actual en formato YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    
    // 2. Establecer la fecha actual como valor inicial y como fecha máxima
    setFechaCulminacion(today);
    setMaxDate(today); // Establece la fecha máxima para el input
    
    setOpen(true);
  };

const handleSubmit = (e) => {
    e.preventDefault();
    
    // Convertir las fechas a objetos Date para la comparación
    const selectedDate = new Date(fechaCulminacion);
    const todayLimit = new Date();
    // ⚠️ Para asegurar que solo se compare la fecha sin la hora, reseteamos la hora de 'todayLimit' a 00:00:00
    todayLimit.setHours(0, 0, 0, 0); 
    
    // 3. Validación de seguridad: Asegura que la fecha seleccionada no sea futura
    if (selectedDate > todayLimit) {
      alert("Error: La fecha de culminación no puede ser un día futuro.");
      return; // Detiene el envío
    }

    if (fechaCulminacion) {
      // Llama a la función proporcionada por el padre con el ID y la fecha
      onFinalizar(mantenimientoId, fechaCulminacion);
      setOpen(false);
      setFechaCulminacion("");
      setMaxDate("");
    } else {
      alert("Por favor, seleccione una fecha de culminación.");
    }
  };

  return (
    <>
      <button className={Styles.buttonFinalizar} onClick={handleOpen}>
        Finalizar
        <svg
          stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
        </svg>
      </button>

      {open && (
        <div
          className={Styles.overlay}
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            className={Styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title-finalizar"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={Styles.closeBtn}
              aria-label="Cerrar"
              onClick={() => setOpen(false)}
            >
              ×
            </button>

            <div className={Styles.cardVehiculo}>
              <h2 id="modal-title-finalizar">Finalizar Mantenimiento N° {mantenimientoId}</h2>
              <form className={Styles.formVehiculo} onSubmit={handleSubmit}>
                <label>
                  Fecha de Culminación
                  <input
                    type="date"
                    name="fechaCulminacion"
                    // 🔑 CLAVE: Usar la propiedad max para limitar la selección
                    max={maxDate} 
                    value={fechaCulminacion}
                    onChange={(e) => setFechaCulminacion(e.target.value)}
                    required
                  />
                </label>
                <div className={Styles.actions}>
                  <button type="submit" className={Styles.submitBtn}>
                    Guardar y Finalizar
                  </button>
                  <button
                    type="button"
                    className={Styles.cancelBtn}
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
    </>
  );
}