"use client";
import React, { useState, useEffect } from "react";
import Style from "./page.module.css";
import axios from "axios";
import apiEndPoin from "../../../config/apiEndPointsUrl.json";

// 🚀 ARRAY DE MARCAS DE VEHÍCULOS RECONOCIDAS (COPIADO DEL PRIMER CÓDIGO)
const CAR_BRANDS = [
  "Toyota",
  "Chevrolet",
  "Ford",
  "Nissan",
  "Honda",
  "Hyundai",
  "Kia",
  "Volkswagen",
  "BMW",
  "Mercedes-Benz",
  "Audi",
  "Mazda",
  "Subaru",
  "Jeep",
  "Tesla",
  "Mitsubishi",
  "Fiat",
  "Renault",
  "Peugeot",
];

export default function ModalCreateVehiculo({
  id,
  placa,
  onVehiculoRegistrado,
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const resetForm = () => {
    setPlacaNew(placa);
    setMarca(CAR_BRANDS[0] || "");
    setModelo("");
    setAnio("");
    setKilometraje("");
  };

  const [placaNew, setPlacaNew] = useState(placa);
  const [marca, setMarca] = useState(CAR_BRANDS[0] || "");
  const [modelo, setModelo] = useState("");
  const [anio, setAnio] = useState("");
  const [kilometraje, setKilometraje] = useState("");

  function Register(placaNew, marca, modelo, anio, kilometraje) {
    axios
      .put(apiEndPoin.vehiculos.actualizarVehiculo.replace("{id}", id), {
        placa: placaNew,
        marca: marca,
        modelo: modelo,
        anio: anio,
        kilometraje: kilometraje,
      })
      .then((response) => {
        alert("Vehiculo modificado exitosamente");
        if (onVehiculoRegistrado) {
          onVehiculoRegistrado();
        }
        resetForm();
        setOpen(false);
        console.log("Vehiculo modificado:", response.data);
      })
.catch((error) => {
    const responseData = error.response ? error.response.data : {};
    const errorMessage = 
        (typeof responseData === 'string' && responseData.length > 0) ? responseData : 
        responseData.message || 
        "Error de conexión o servidor no disponible. (Consulta la consola para detalles)";

    alert(`Error al Modificar el vehículo:\n${errorMessage}`);
    console.error("Detalles del Error del Servidor:", error.response); 
});
  }

  const onSubmit = (e) => {
    e.preventDefault();
    if (!marca || marca.length === 0) {
      alert("Por favor, seleccione una Marca de vehículo.");
      return;
    }
    Register(placaNew, marca, modelo, anio, kilometraje);
  };

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
              <h2 id="modal-title">Modifcar Vehiculo</h2>
              <form className={Style.formVehiculo} onSubmit={onSubmit}>
                <label>
                  Placa:
                  <input
                    type="text"
                    name="placa"
                    value={placaNew}
                    onChange={(e) => setPlacaNew(e.target.value)}
                    // Se quitó 'required'
                  />
                </label>
                <label>
                  Marca:
                  <select
                    name="marca"
                    value={marca}
                    onChange={(e) => setMarca(e.target.value)}
                    // Se quitó 'required'
                  >
                    <option value="" disabled>
                      Seleccione una marca
                    </option>

                    {CAR_BRANDS.map((brand) => (
                      <option key={brand} value={brand}>
                        {brand}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Modelo:
                  <input
                    type="text"
                    name="modelo"
                    value={modelo}
                    onChange={(e) => setModelo(e.target.value)}
                    // Se quitó 'required'
                  />
                </label>
                <label>
                  Año:
                  <input
                    type="number"
                    name="año"
                    value={anio}
                    onChange={(e) => setAnio(e.target.value)}
                    // Se quitó 'required'
                  />
                </label>
                <label>
                  Kilometraje:
                  <input
                    type="number"
                    name="kilometraje"
                    value={kilometraje}
                    onChange={(e) => setKilometraje(e.target.value)}
                    // Se quitó 'required'
                  />
                </label>
                <div className={Style.actions}>
                  <button type="submit" className={Style.submitBtn}>
                    Modificar Vehículo
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
