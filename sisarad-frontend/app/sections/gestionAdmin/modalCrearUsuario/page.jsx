"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import apiEndPoin from "../../../config/apiEndPointsUrl.json";
import Styles from "./page.module.css";

export default function ModalCrearUsuario({ onClose }) {
  const [cedula, setCedula] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Bloquear el scroll del body mientras el modal esté abierto
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const getPasswordStrength = (password) => {
    let score = 0;
    if (!password) return score;
    const letters = {};
    for (let i = 0; i < password.length; i++) {
      letters[password[i]] = (letters[password[i]] || 0) + 1;
      score += 5.0 / letters[password[i]];
    }
    const variations = {
      digits: /\d/.test(password),
      lower: /[a-z]/.test(password),
      upper: /[A-Z]/.test(password),
      nonWords: /\W/.test(password),
    };
    let variationCount = 0;
    for (const check in variations) {
      variationCount += variations[check] === true ? 1 : 0;
    }
    score += (variationCount - 1) * 10;
    return parseInt(score, 10);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!cedula || !nombre || !apellido || !correo || !clave || !role) {
      setError("Todos los campos son obligatorios.");
      return;
    }

    if (clave !== repeatPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (getPasswordStrength(clave) < 50) {
      setError("La contraseña es muy débil.");
      return;
    }

    setLoading(true);
    try {
      await axios.post(apiEndPoin.user.createUser, {
        id: cedula,
        nombre,
        apellido,
        email: correo,
        clave,
        role,
        activo: true,
      });
      alert("Usuario creado exitosamente.");
      if (onClose) {
        onClose(true); // true indica que debe recargarse la lista
      }
    } catch (err) {
      console.error("Error al crear usuario:", err);
      const backendMessage = err.response?.data || "Error al registrar el usuario.";
      setError(typeof backendMessage === "string" ? backendMessage : "No se pudo registrar el usuario.");
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength(clave);
  const strengthColor = strength > 80 ? "green" : strength > 50 ? "orange" : "red";

  return (
    <div className={Styles.modalOverlay} onClick={() => onClose && onClose(false)}>
      <div className={Styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2>Registrar nuevo usuario</h2>
        <form onSubmit={handleSubmit}>
          <div className={Styles.formGroup}>
            <label htmlFor="cedula">Cédula</label>
            <input
              id="cedula"
              type="text"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
            />
          </div>

          <div className={Styles.formGroup}>
            <label htmlFor="nombre">Nombre</label>
            <input
              id="nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div className={Styles.formGroup}>
            <label htmlFor="apellido">Apellido</label>
            <input
              id="apellido"
              type="text"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
            />
          </div>

          <div className={Styles.formGroup}>
            <label htmlFor="correo">Correo electrónico</label>
            <input
              id="correo"
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
            />
          </div>

          <div className={Styles.formGroup}>
            <label htmlFor="clave">Contraseña</label>
            <input
              id="clave"
              type="password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
            />
            <div className={Styles.strengthBarContainer}>
              <div
                className={Styles.strengthBar}
                style={{
                  width: `${Math.min(strength, 100)}%`,
                  backgroundColor: strengthColor,
                }}
              />
            </div>
          </div>

          <div className={Styles.formGroup}>
            <label htmlFor="repeatPassword">Confirmar contraseña</label>
            <input
              id="repeatPassword"
              type="password"
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
            />
          </div>

          <div className={Styles.formGroup}>
            <label htmlFor="role">Tipo de usuario</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="">Seleccione...</option>
              <option value="administrador">administrador</option>
              <option value="usuario">usuario</option>
            </select>
          </div>

          {error && <p className={Styles.error}>{error}</p>}

          <div className={Styles.buttonContainer}>
            <button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Crear usuario"}
            </button>
            <button type="button" onClick={() => onClose && onClose(false)} disabled={loading}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
