"use client";
import React, { useState, useEffect } from "react";
import Style from "./page.module.css";
import axios from "axios";
import apiEndPoin from "../../../config/apiEndPointsUrl.json";

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

export default function ModalCreateVehiculo({ onVehiculoRegistrado }) {
  const [open, setOpen] = useState(false);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const resetForm = () => {
    setMarca(CAR_BRANDS[0] || "");
    setModelo("");
    setAnio("");
    setPlaca("");
    setKilometraje("");
  };

  function Register(marca, modelo, anio, placa, kilometraje) {
    axios
      .post(apiEndPoin.vehiculos.crearVehiculo, {
        marca: marca,
        modelo: modelo,
        anio: anio,
        placa: placa,
        kilometraje: kilometraje,
      })
      .then((response) => {
        console.log("Vehiculo registrado:", response.data);
        alert("Vehiculo registrado exitosamente");
        if (onVehiculoRegistrado) {
          onVehiculoRegistrado();
        }
        resetForm();
        setOpen(false);
      })
      .catch((error) => {
        let errorMessage = "Error de conexión o servidor no disponible.";

        if (error.response) {
          const data = error.response.data;
          if (typeof data === "string") {
            errorMessage = data;
          } else if (data && typeof data === "object") {
            errorMessage = data.message || JSON.stringify(data);
          }
        }

        alert(`Error al registrar el vehículo:\n${errorMessage}`);
      });
  }

const onSubmit = (e) => {
    e.preventDefault();

    if (!marca || marca.length === 0) {
      alert("Por favor, seleccione una Marca de vehículo.");
      return;
    }
    
    const inputYear = parseInt(anio, 10);
    if (inputYear > currentYear) {
      alert(
        `El año del vehículo (${inputYear}) no puede ser posterior al año actual (${currentYear}).`
      );
      return;
    }

    Register(marca, modelo, anio, placa, kilometraje);
  };

  const [marca, setMarca] = useState(CAR_BRANDS[0] || "");
  const [modelo, setModelo] = useState("");
  const [anio, setAnio] = useState("");
  const [placa, setPlaca] = useState("");
  const [kilometraje, setKilometraje] = useState("");

  return (
    <div className={Style.ModalCreateVehiculo}>
      <button className={Style.openButton} onClick={() => setOpen(true)}>
        Registrar Vehiculo Nuevo
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
            } 
          >
            <button
              className={Style.closeBtn}
              aria-label="Cerrar"
              onClick={() => setOpen(false)}
            >
              ×
            </button>

            <div className={Style.cardVehiculo}>
              <h2 id="modal-title">Registrar nuevo Vehiculo</h2>
              <form className={Style.formVehiculo} onSubmit={onSubmit}>
                <label>
                  Placa:
                  <input
                    type="text"
                    name="placa"
                    value={placa}
                    onChange={(e) => setPlaca(e.target.value)}
                    required
                  />
                </label>
                <label>
                  Marca:
                  <select
                    name="marca"
                    value={marca}
                    onChange={(e) => setMarca(e.target.value)}
                    required
                  >
                    <option value="" disabled>Seleccione una marca</option>
                    
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
                    required
                  />
                </label>
                <label>
                  Año:
                  <input
                    type="number"
                    name="año"
                    value={anio}
                    onChange={(e) => setAnio(e.target.value)}
                    required
                  />
                </label>
                <label>
                  Kilometraje:
                  <input
                    type="number"
                    name="kilometraje"
                    value={kilometraje}
                    onChange={(e) => setKilometraje(e.target.value)}
                    required
                  />
                </label>
                <div className={Style.actions}>
                  <button type="submit" className={Style.submitBtn}>
                    Registrar Vehículo
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
