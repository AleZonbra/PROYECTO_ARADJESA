// ./imprimirMantenimiento/page.jsx
import React from 'react';
import Styles from '../page.module.css'; // Asegúrate de importar los estilos

export const MantenimientoReport = ({ mantenimiento }) => {
  // Si no hay mantenimiento seleccionado, no renderiza nada
  if (!mantenimiento) return null;

  return (
    <div className={Styles.printableReport}>
      <div className={Styles.reportHeader}>
        <h1>Reporte de Mantenimiento</h1>
        <h2>Vehículos de Alimentos Amana</h2>
        <p><strong>Fecha:</strong> {mantenimiento.fecha}</p>
      </div>

      {/* Datos del Mantenimiento */}
      <div className={Styles.reportSection}>
        <h3>Detalles Generales</h3>
        <p><strong>Placa:</strong> {mantenimiento.vehiculo?.placa}</p>
        <p><strong>Tipo:</strong> {mantenimiento.tipoMantenimiento}</p>
        <p><strong>Descripción:</strong> {mantenimiento.observacion}</p>
      </div>

      {/* Tabla de Detalles */}
      <div className={Styles.reportSection}>
        <h3>Repuestos y Servicios</h3>
        <table className={Styles.reportTable}>
          <thead>
            <tr>
              <th>Repuesto</th>
              <th>Cant.</th>
              <th>Precio</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {mantenimiento.detallesMantenimiento?.map((detalle, i) => (
              <tr key={i}>
                <td>{detalle.repuesto?.nombre}</td>
                <td>{detalle.cantidad}</td>
                <td>{detalle.repuesto?.precio}$</td>
                <td>{detalle.costoTotal}$</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
             <tr>
                <td colSpan="3" style={{textAlign: 'right'}}><strong>Total:</strong></td>
                <td><strong>{mantenimiento.costo}$</strong></td>
             </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

// Evitar que Next prerenderice esta ruta con props que contienen funciones.
// Proporcionamos una exportación por defecto mínima para la ruta.
export default function Page() {
  return null;
}