// src/app/sections/vehiculos/imprimirVehiculo/VehiculoReport.jsx
import React from 'react';
import Styles from '../page.module.css'; 

// Componente de reporte para la impresión
export function VehiculoReport({ vehiculo }) {
  if (!vehiculo) {
    // Retorna null si no hay un vehículo seleccionado para el reporte
    return null;
  }

  // Usamos el campo correcto: 'registroKilometraje' como en tu ModalInformacionVehiculo
  const historialKilometraje = vehiculo.registroKilometraje || [];
  
  // Ordenamos el historial para mostrar el más reciente primero (opcional)
  const sortedHistorial = historialKilometraje.slice().sort((a, b) => {
    // Asume que la fecha está en 'a.fecha' o similar. Si no, usa el ID o Kilometraje.
    // Aquí usamos el ID como fallback si 'fecha' no es consistente.
    return (b.id || 0) - (a.id || 0);
  });

  const info = [
    { label: "Marca", value: vehiculo.marca },
    { label: "Modelo", value: vehiculo.modelo },
    { label: "Año", value: vehiculo.anio },
    { label: "Placa", value: vehiculo.placa },
    { label: "Kilometraje Actual", value: `${vehiculo.kilometraje || 'N/A'} km` },
    // Los siguientes campos son opcionales y dependen de tu API
  ];

  return (
    // ⚠️ Importante: Usamos la clase 'printReport' que controlará la visibilidad.
    <div className={Styles.printReport} id="vehiculo-report">
      <h1 className={Styles.tituloReporte}>Reporte Detallado de Vehículo</h1>
      <h2 className={Styles.subtituloReporte}>{vehiculo.marca} {vehiculo.modelo} - Placa: {vehiculo.placa}</h2>
      
      {/* 1. Datos Principales */}
      <div className={Styles.infoGridReport}>
        {info.map((item, index) => (
          <div key={index} className={Styles.infoItemReport}>
            <strong className={Styles.labelReport}>{item.label}:</strong>
            <span className={Styles.valueReport}>{item.value}</span>
          </div>
        ))}
      </div>

      <h3 className={Styles.sectionTitleReport}>Historial de Kilometraje Registrado</h3>
      
      {/* 2. Historial de Kilometraje */}
      {sortedHistorial.length > 0 ? (
        <table className={Styles.tableReport}>
          <thead>
            <tr>
              <th>ID Registro</th>
              <th>Kilometraje (km)</th>
              <th>Fecha de Registro</th>
            </tr>
          </thead>
          <tbody>
            {sortedHistorial.map((registro, index) => (
              <tr key={index}>
                <td>{registro.id || 'N/A'}</td>
                <td>{registro.kilometraje || 'N/A'} km</td>
                {/* Asegúrate de usar el campo de fecha correcto de tu API, por ejemplo: registro.fecha */}
                <td>{registro.fecha || 'N/A'}</td> 
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className={Styles.noDataReport}>No hay historial de kilometraje registrado para este vehículo.</p>
      )}

      <p className={Styles.footerReport}>Reporte generado el: {new Date().toLocaleDateString()}</p>
    </div>
  );
}

// Añadimos una exportación por defecto mínima para que Next no intente prerenderizar
// esta ruta con props complejas que pueden contener funciones.
export default function Page() {
  return null;
}