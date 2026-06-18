"use client";
import React, { useState, useEffect } from "react";
import Style from "./page.module.css";
import axios from "axios";
import apiEndPoin from "../../../config/apiEndPointsUrl.json";

export default function ModalRegistrarRepuesto({ id, onRepuestoRegistrado }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);


    const resetForm = () => {
        setNombre('');
        setPrecio('');
        setStock('');
    };

    function Register(id, nombre, precio, stock) {
      axios
        .put(apiEndPoin.repuestos.actualizarRepuesto.replace("{id}", id), {
          id: id,
          nombre: nombre,
          precio: precio,
          stock: stock,
        })
        .then((response) => {
          console.log("Repuesto registrado:", response.data);
          alert("Repuesto registrado exitosamente");
          if (onRepuestoRegistrado) {
            onRepuestoRegistrado();
          }
          resetForm();
          setOpen(false);
        })
        .catch((error) => {
          console.error("Error al registrar el repuesto:", error);
        });
    }

      const onSubmit = (e) => {
    e.preventDefault();
        Register(id, nombre, precio, stock);
  };

  // Register Vehiculo
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [stock, setStock] = useState("");

  return (
    <div className={Style.ModalCreateVehiculo}>
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
            onClick={(e) =>
              e.stopPropagation()
            } /* evitar cierre al click dentro del modal */
          >
            <button
              className={Style.closeBtn}
              aria-label="Cerrar"
              onClick={() => setOpen(false)}
            >
              ×
            </button>

            <div className={Style.cardVehiculo}>
              <h2 id="modal-title">Modificar Repuesto</h2>
              <form className={Style.formVehiculo} onSubmit={onSubmit}>
                <label>
                  Nombre del Repuesto:
                  <input
                    type="text"
                    name="nombre del repuestos"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    
                  />
                </label>
                <label>
                  Precio:
                  <input
                    type="text"
                    name="precio"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    
                  />
                </label>
                <label>
                  Cantidad:
                  <input
                    type="text"
                    name="modelo"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    
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
