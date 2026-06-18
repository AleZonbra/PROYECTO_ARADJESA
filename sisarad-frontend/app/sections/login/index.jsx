"use client";
import React, { useState, useEffect } from "react";
import Styles from "./page.module.css";
import { useUser } from "../../context/UserContext";
import { useRouter } from "next/navigation";
import apiEndPoin from "../../config/apiEndPointsUrl.json";
import axios from "axios";

export default function Login() {
  const { setUserData } = useUser();
  const router = useRouter();
  const [usuario, setUsuario] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    verifyLogin(usuario, password).finally(() => setLoading(false));
  };

  async function verifyLogin(usuarioLogin, clave) {
    try {
      const response = await axios.get(
        apiEndPoin.user.obtenerUsuarioPorUsuario.replace("{usuario}", usuarioLogin)
      );
      const user = response.data;
      if (user && user.clave === clave) {
        setUserData(user);
        router.push("/sections/home");
      } else {
        setError("Usuario o contraseña incorrectos.");
      }
    } catch (err) {
      console.error("Error al conectar con el servidor:", err);
      setError("Error al conectar con el servidor. Verifique que el backend esté corriendo.");
    }
  }

  return (
    <div className={Styles.containerLogin}>
      <form onSubmit={handleLogin} className={Styles.formLogin}>
        <h2 className={Styles.h2Login}>SISARAD — Iniciar Sesión</h2>
        <div className={Styles.containerInputsLogin} suppressHydrationWarning>
          <label htmlFor="usuario">
            <span>Usuario</span>
          </label>
          <input
            type="text"
            id="usuario"
            name="usuario"
            autoComplete="username"
            placeholder="admin"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
          />

          <label htmlFor="contraseña">
            <span>Contraseña</span>
          </label>
          <input
            type="password"
            id="contraseña"
            name="contraseña"
            autoComplete="current-password"
            placeholder="Ingresa tu contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className={Styles.error}>{error}</p>}

          <button type="submit" disabled={loading} className={Styles.buttonLogin}>
            {loading ? "Cargando..." : "Ingresar"}
          </button>
        </div>
      </form>
    </div>
  );
}
