"use client";
import React, { useState, useEffect } from "react";
import Style from "./page.module.css";
import axios from "axios";
import apiEndPoin from "../../../../config/apiEndPointsUrl.json";
import { useUser } from "../../../../context/UserContext";
import ModalModificarDetalleMantenimiento from "../modalModificarDetalleMantenimiento";

export default function ModaMoreInformationMantenimiento({
  mantenimientoId,
  onMantenimientoRegistrado,
}) {
  const { userData } = useUser();
  const [mantenimientoSeleccionado, setMantenimientoSeleccionado] =
    useState(null);
  const [isClient, setIsClient] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [open, setOpen] = useState(false);

  const fetchMantenimientoById = async (id) => {
    if (!id) return;
    setCargando(true);
    try {
      const response = await axios.get(
        apiEndPoin.mantenimeinto.listarMantenimientos
      );
      const mantenimiento = response.data.find((m) => m.id === id);
      setMantenimientoSeleccionado(mantenimiento || null);
    } catch (error) {
      console.error(`Error al obtener mantenimiento ${id}:`, error);
      setMantenimientoSeleccionado(null);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (open && mantenimientoId) {
      fetchMantenimientoById(mantenimientoId);
    }
  }, [open, mantenimientoId]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) {
      window.addEventListener("keydown", onKey);
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.classList.remove('no-scroll');
    };
  }, [open]);

  const onSubmit = (e) => {
    e.preventDefault();
    setOpen(false);
  };

  if (!isClient || !userData) return null;

  const detalles = mantenimientoSeleccionado?.detallesMantenimiento || [];

  const handleDelete = async (detalleMantenimientoId) => {
    if (
      !window.confirm(
        `¿Estás seguro de que deseas eliminar el mantenimiento con ID ${detalleMantenimientoId}?`
      )
    ) {
      return;
    }

    try {
      await axios.delete(
        apiEndPoin.detalleMantenimiento.eliminarDetalleMantenimiento.replace(
          "{detalleMantenimientoId}",
          detalleMantenimientoId
        )
      );
      alert(
        `Mantenimiento con ID ${detalleMantenimientoId} eliminado exitosamente.`
      );
      fetchMantenimientoById(mantenimientoId);
    } catch (error) {
    }
  };

  const handleDetalleModificado = () => {
    fetchMantenimientoById(mantenimientoId);
  };

  return (
    <div className={Style.modalMoreInformationMantenimiento}>
      <button className={Style.buttonMore} onClick={() => setOpen(true)}>Ver</button>

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
              <h2 id="modal-title">Informacion del Mantenimiento Detallada</h2>
              <table>
                <thead>
                  <tr>
                    <th>
                      N° de Mant. <br />
                      Detallado
                    </th>
                    <th>Repuesto</th>
                    <th>Cantidad</th>
                    <th>
                      Precio <br /> C/U
                    </th>
                    <th>Total</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {cargando ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center" }}>
                        Cargando detalles...
                      </td>
                    </tr>
                  ) : detalles.length > 0 ? (
                    detalles.map((detalle, index) => (
                      <tr key={detalle.id}>
                        <td>{detalle.id}</td>
                        <td>{detalle.nombreRepuestoFijo}</td>
                        <td>{detalle.cantidad}</td>
                        <td>{detalle.costoUnitarioFijo}$</td>
                        <td>
                          {detalle.cantidad * (detalle.repuesto?.precio || 0)}$
                        </td>
                        <td>
                          <button
                            type="button"
                            className={Style.buttonDelete}
                            onClick={() => handleDelete(detalle.id)}
                          >
                            Eliminar
                          </button>
                          <ModalModificarDetalleMantenimiento
                            mantenimientoSeleccionado={mantenimientoSeleccionado?.id}
                            id={detalle.id}
                            onMantenimientoRegistrado={handleDetalleModificado}
                          />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center" }}>
                        No hay detalles registrados para este mantenimiento.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
