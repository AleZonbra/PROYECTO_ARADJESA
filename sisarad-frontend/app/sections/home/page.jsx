"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useUser } from "../../context/UserContext";
import apiEndPoin from "../../config/apiEndPointsUrl.json";
import Styles from "../shared.module.css";

export default function Home() {
  const { userData } = useUser();
  const router = useRouter();
  const [resumen, setResumen] = useState(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => setIsClient(true), []);

  useEffect(() => {
    if (!isClient) return;
    if (!userData) router.replace("/");
  }, [isClient, userData, router]);

  useEffect(() => {
    if (!userData) return;
    axios
      .get(apiEndPoin.dashboard.resumenSemanal)
      .then((response) => setResumen(response.data))
      .catch((error) => {
        console.error("Error al cargar dashboard:", error);
        setResumen(null);
      });
  }, [userData]);

  if (!isClient || !userData) return null;

  const cards = [
    { label: "Unidades movidas (sem.)", value: resumen?.unidadesMovidasSemana ?? 0 },
    { label: "Vendedores activos (sem.)", value: resumen?.vendedoresActivosSemana ?? 0 },
    { label: "Clientes atendidos (sem.)", value: resumen?.clientesAtendidosSemana ?? 0 },
    { label: "Despachos procesados (sem.)", value: resumen?.despachosProcesadosSemana ?? 0 },
    { label: "Líder de ventas (sem.)", value: resumen?.liderVentasSemana ?? "NINGUNO" },
    { label: "Producto más despachado (sem.)", value: resumen?.productoMasDespachadoSemana ?? "NINGUNO" },
  ];

  return (
    <div className={Styles.page}>
      <h1 className={Styles.title}>Tablero de Control Semanal</h1>
      <p className={Styles.subtitle}>
        Métricas operativas de despachos, rotación de inventario y alertas de vencimiento.
      </p>

      <div className={Styles.cardGrid}>
        {cards.map((card) => (
          <div key={card.label} className={Styles.card}>
            <div className={Styles.cardLabel}>{card.label}</div>
            <div className={Styles.cardValue}>{card.value}</div>
          </div>
        ))}
      </div>

      <div className={Styles.panel}>
        <h2 className={Styles.title}>Productos próximos a vencer</h2>
        <div className={Styles.tableWrapper}>
        <table className={Styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Producto</th>
              <th>Serial/Lote</th>
              <th>Cantidad</th>
              <th>Vencimiento</th>
            </tr>
          </thead>
          <tbody>
            {(resumen?.productosProximosVencer || []).map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.producto}</td>
                <td>{item.serialLote}</td>
                <td>{item.cantidad}</td>
                <td>{item.fechaExpiracion}</td>
              </tr>
            ))}
            {(!resumen?.productosProximosVencer || resumen.productosProximosVencer.length === 0) && (
              <tr>
                <td colSpan="5">No hay productos registrados con fecha de vencimiento.</td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
