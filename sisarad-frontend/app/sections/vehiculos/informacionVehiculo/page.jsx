"use client";
import React, { useState, useEffect } from "react";
import Style from "./page.module.css"; // Asegúrate de que este archivo CSS exista o usa el de tu otro modal.
import axios from "axios";
import apiEndPoin from "../../../config/apiEndPointsUrl.json";
import ReminderModal from "../reminderModal";
import RemindersList from "../remindersList";
import NotificationsList from "../notificationsList";
import { useUser } from "../../../context/UserContext";

export default function ModalInformacionVehiculo({ placa }) {
  const { userData } = useUser();
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [open, setOpen] = useState(false);
  const [refreshReminders, setRefreshReminders] = useState(0);

  // Función para obtener el vehículo por su placa
  const fetchVehiculoByPlaca = async (vehiculoPlaca) => {
    if (!vehiculoPlaca) return;
    setCargando(true);
    try {
      // ✅ Usamos el endpoint para obtener un vehículo por placa
      // Asumo que tienes un endpoint para buscar por placa que trae el historial (JOIN FETCH)
      const url = apiEndPoin.vehiculos.obtenerVehiculoPorPlaca.replace(
        "{placa}",
        vehiculoPlaca
      );
      const response = await axios.get(url);
      setVehiculoSeleccionado(response.data);
      console.log("Vehículo seleccionado:", vehiculoSeleccionado);
    } catch (error) {
      console.error(`Error al obtener vehículo ${vehiculoPlaca}:`, error);
      setVehiculoSeleccionado(null);
    } finally {
      setCargando(false);
    }
  };

  // ✅ Efecto que carga los datos cada vez que el modal se abre
  useEffect(() => {
    if (open && placa) {
      fetchVehiculoByPlaca(placa);
    }
  }, [open, placa]);

  // Manejo de la hidratación (Next.js)
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Manejo de la tecla 'Escape'
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Retorno condicional
  if (!isClient || !userData) return null;

  // Obtener el historial de kilometraje (seguro contra null)
  const historialKilometraje =
    vehiculoSeleccionado?.registroKilometraje || [];

  return (
    <div className={Style.modalMoreInformationVehiculo}>
      {/* ---------------- Botón de Apertura ---------------- */}
      <button className={Style.buttonMore} onClick={() => setOpen(true)}>
        <svg
          stroke="currentColor"
          fill="currentColor"
          strokeWidth="0"
          viewBox="0 0 24 24"
          height="1em"
          width="1em"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g id="Circle_Info">
            <g>
              <g>
                <path d="M11.5,15a.5.5,0,0,0,1,0h0V10.981a.5.5,0,0,0-1,0Z"></path>
                <circle cx="12" cy="8.999" r="0.5"></circle>
              </g>
              <path d="M12,2.065A9.934,9.934,0,1,1,2.066,12,9.945,9.945,0,0,1,12,2.065Zm0,18.867A8.934,8.934,0,1,0,3.066,12,8.944,8.944,0,0,0,12,20.932Z"></path>
            </g>
          </g>
        </svg>
      </button>
      {/* ---------------- Contenido del Modal ---------------- */}
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
            aria-labelledby="modal-title-vehiculo"
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
              <h2 id="modal-title-vehiculo">
                Información Detallada del Vehículo
              </h2>
              {cargando ? (
                <p style={{ textAlign: "center" }}>Cargando información...</p>
              ) : vehiculoSeleccionado ? (
                <>
                  {/* Sección de Datos Principales */}
                  <div className={Style.infoGrid}>
                    <p>
                      <strong>Placa:</strong> {vehiculoSeleccionado.placa}
                    </p>
                    <p>
                      <strong>Marca:</strong> {vehiculoSeleccionado.marca}
                    </p>
                    <p>
                      <strong>Modelo:</strong> {vehiculoSeleccionado.modelo}
                    </p>
                    <p>
                      <strong>Año:</strong> {vehiculoSeleccionado.anio}
                    </p>
                    <p>
                      <strong>Kilometraje Actual:</strong>{" "}
                      {vehiculoSeleccionado.kilometraje ? vehiculoSeleccionado.kilometraje.toLocaleString('es-ES') : 'N/A'} km
                    </p>
                  </div>

                  <hr style={{ margin: "20px 0" }} />

                  {/* Sección de Historial de Kilometraje */}
                  <h3>Historial de Kilometraje</h3>
                  <table className={Style.tableHistorial}>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Kilometraje Registrado</th>
                        <th>Fecha de Registro</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historialKilometraje.length > 0 ? (
                        historialKilometraje
                          // Opcional: Invertir el orden para mostrar el más reciente primero
                          .slice() 
                          .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                          .map((registro) => (
                            <tr key={registro.id}>
                              <td>{registro.id}</td>
                              <td>{registro.kilometraje ? registro.kilometraje.toLocaleString('es-ES') : 'N/A'} km</td>
                              <td>{registro.fecha}</td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td colSpan="3" style={{ textAlign: "center" }}>
                            No hay historial de kilometraje.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* Panel para crear/editar recordatorios del vehículo */}
                  <div style={{marginTop:16}}>
                    <ReminderModal
                      vehiculoId={vehiculoSeleccionado?.id}
                      onSaved={() => setRefreshReminders((prev) => prev + 1)}
                    />
                    <RemindersList
                      vehiculoId={vehiculoSeleccionado?.id}
                      refreshKey={refreshReminders}
                    />
                    <NotificationsList vehiculoId={vehiculoSeleccionado?.id} />
                  </div>
                </>
              ) : (
                <p style={{ textAlign: "center", color: "red" }}>
                  Error al cargar los datos del vehículo.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}