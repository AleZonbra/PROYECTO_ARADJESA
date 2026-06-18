"use client";
import React from "react";
import Style from "./page.module.css";
import { useUser } from "../../context/UserContext";

export default function Footer() {
  const { userData } = useUser();

  if (!userData) return null;

  return (
    <footer className={Style.footer}>
      <div className={Style.toolbar}>
        <div className={Style.copyWrite}>© 2026 SISARAD — Todos los derechos reservados</div>
      </div>
      <div className={Style.infoFooter}>
        <p className={Style.infoText}>Sistema de Información SISARAD</p>
        <p className={Style.infoText}>Soporte: soporte@sisarad.local</p>
      </div>
    </footer>
  );
}
