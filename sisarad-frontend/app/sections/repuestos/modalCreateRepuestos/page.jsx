"use client";
import React, { useState, useEffect } from "react";
import Style from "./page.module.css";
import axios from "axios";
import apiEndPoin from "../../../config/apiEndPointsUrl.json";

export default function ModalRegistrarRepuesto({ onRepuestoRegistrado }) {
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

    function Register(nombre, precio, stock) {
      axios
        .post(apiEndPoin.repuestos.crearRepuesto, {
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
        Register(nombre, precio, stock);
  };

  // Register Vehiculo
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [stock, setStock] = useState("");

  return (
    <div className={Style.ModalCreateVehiculo}>
      <button className={Style.openButton} onClick={() => setOpen(true)}>
        Registrar Nuevo Repuestos
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
              <h2 id="modal-title">Registrar Repuesto</h2>
              <form className={Style.formVehiculo} onSubmit={onSubmit}>
                <label>
                  Nombre del Repuesto:
                  <input
                    type="text"
                    name="nombre del repuestos"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                  />
                </label>
                <label>
                  Precio:
                  <input
                    type="text"
                    name="precio"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    required
                  />
                </label>
                <label>
                  Cantidad:
                  <input
                    type="text"
                    name="modelo"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    required
                  />
                </label>
                <div className={Style.actions}>
                  <button type="submit" className={Style.submitBtn}>
                    Registrar Repuesto
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
