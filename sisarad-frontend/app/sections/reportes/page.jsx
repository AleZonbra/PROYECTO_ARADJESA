"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "../../context/UserContext";
import Styles from "./page.module.css";
import ReporteDisponibilidad from "./reporteDisponibilidad/page";
import ReporteTopVehiculos from "./reporteTopVehiculos/page";
import ReporteCostos from "./reporteCostos/page";
import ReporteMantenimientos from "./reporteMantenimientos/page";
import ReporteVehiculos from "./reporteVehiculos/page";
import ReporteRepuestos from "./reporteRepuestos/page";
import PlanificacionPreventiva from "./planificacionPreventiva/page";
import ControlRepuestos from "./controlRepuestos/page";

export default function Reportes() {
    const { userData } = useUser();
    const [activeTab, setActiveTab] = useState("disponibilidad");
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient || !userData) return null;

    const tabs = [
        { id: "disponibilidad", label: "Disponibilidad Mensual" },
        { id: "topVehiculos", label: "Top Vehículos" },
        { id: "costos", label: "Costos Mensuales" },
        { id: "mantenimientos", label: "Mantenimientos" },
        { id: "vehiculos", label: "Vehículos" },
        { id: "repuestos", label: "Repuestos" },
        { id: "planificacion", label: "Planificación Preventiva" },
        { id: "controlRepuestos", label: "Control Repuestos" },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case "disponibilidad":
                return <ReporteDisponibilidad />;
            case "topVehiculos":
                return <ReporteTopVehiculos />;
            case "costos":
                return <ReporteCostos />;
            case "mantenimientos":
                return <ReporteMantenimientos />;
            case "vehiculos":
                return <ReporteVehiculos />;
            case "repuestos":
                return <ReporteRepuestos />;
            case "planificacion":
                return <PlanificacionPreventiva />;
            case "controlRepuestos":
                return <ControlRepuestos />;
            default:
                return <ReporteDisponibilidad />;
        }
    };

    return (
        <div className={Styles.containerReportes}>
            <h1 className={Styles.title}>Reportes</h1>
            <p className={Styles.paragraph}>
                Accede a todos los reportes y análisis del sistema de mantenimiento de vehículos.
            </p>

            <div className={Styles.tabsContainer}>
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={`${Styles.tab} ${activeTab === tab.id ? Styles.tabActive : ""}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className={Styles.contentContainer}>
                {renderContent()}
            </div>
        </div>
    );
}
