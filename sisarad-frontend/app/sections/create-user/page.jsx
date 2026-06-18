"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Styles from "./page.module.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useUser } from "../../context/UserContext";
import Link from "next/link";
import axios from "axios";
import apiEndPoin from "../../config/apiEndPointsUrl.json";

// Modal Component
const AdminModal = ({ onAdminSubmit, error, onClose }) => {
  const [adminPasswordInput, setAdminPasswordInput] = useState("");

const handleSubmit = (e) => {
    e.preventDefault();
    onAdminSubmit(adminPasswordInput);
  };

return (
    <div className={Styles.modalOverlay}>
      <div className={Styles.modalContent}>
        <button onClick={onClose} className={Styles.closeButton}>
          X
        </button>
        <h2>Verificación de Administrador</h2>
        <p>
          Por favor, ingrese la contraseña de administrador para completar el
          registro.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={adminPasswordInput}
            onChange={(e) => setAdminPasswordInput(e.target.value)}
            placeholder="Contraseña de administrador"
            className={Styles.modalInput}
          />
          {error && <p className={Styles.error}>{error}</p>}
          <button type="submit" className={Styles.modalButton}>
            Verificar
          </button>
        </form>
      </div>
    </div>
  );
};

export default function CreateUser() {
  const router = useRouter();
  const { userData, setRegisteredUser, tempUser, setTempField, resetTempUser } =
    useUser();

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { nombre, apellido, correo, clave, repeatPassword, cedula, role } =
    tempUser;
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState("");

  const isAdmin = userData?.role === "administrador";

  if (!isClient) return null;

  if (!isAdmin) {
    return (
      <div className={Styles.containerCreateUser}>
        <p className={Styles.error}>
          El registro de usuarios solo puede realizarse desde dentro de la
          aplicación por un usuario administrador.
        </p>
        <button
          type="button"
          className={Styles.buttonCreateUser}
          onClick={() => router.push("/sections/login")}
        >
          Volver al inicio de sesión
        </button>
      </div>
    );
  }

  const getPasswordStrength = (clave) => {
    let score = 0;
    if (!clave) return score;
    let letters = {};
    for (let i = 0; i < clave.length; i++) {
      letters[clave[i]] = (letters[clave[i]] || 0) + 1;
      score += 5.0 / letters[clave[i]];
    }
    let variations = {
      digits: /\d/.test(clave),
      lower: /[a-z]/.test(clave),
      upper: /[A-Z]/.test(clave),
      nonWords: /\W/.test(clave),
    };
    let variationCount = 0;
    for (let check in variations) {
      variationCount += variations[check] === true ? 1 : 0;
    }
    score += (variationCount - 1) * 10;
    return parseInt(score);
  };

const handleCreateUser = (e) => {
    e.preventDefault();
    setError("");
    // Validaciones previas al modal (opcional, pero recomendado)
    if (clave !== repeatPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (getPasswordStrength(clave) < 50) {
      setError("La contraseña es muy débil.");
      return;
    }
    setIsModalOpen(true);
  };

const handleAdminVerification = async (enteredAdminPassword) => {
    setError(""); // Limpiar errores anteriores del modal
    
    // 1. Obtener la clave de administrador del backend
    try {
      const response = await axios.get(apiEndPoin.admin.obtenerClaveAdmin);
      
      // La respuesta del backend debe ser un objeto con la propiedad 'clave'.
      const adminPasswordFromBackend = response.data[0].clave;
 
      // Si adminPasswordFromBackend es undefined, significa que el backend no la envió.
      if (!adminPasswordFromBackend) {
           setError("Error: El servidor no proporcionó la clave del administrador. Revise el backend.");
           return;
      }
      
      // 2. Realizar la verificación
      if (enteredAdminPassword === adminPasswordFromBackend) {
        // La clave de administrador es correcta, proceder con el registro
        
        const Register = (cedula, nombre, apellido, correo, clave, role) => {
            // ... (Lógica de axios.post para crear usuario)
            axios
            .post(apiEndPoin.user.createUser, {
              id: cedula,
              nombre: nombre,
              apellido: apellido,
              email: correo,
              clave: clave,
              role: role,
            })
            .then((response) => {
              resetTempUser();
              setIsModalOpen(false);
              alert("Validado exitosamente el registro del usuario");
              router.push("/sections/login");
            })
            .catch((error) => {
              console.error("Error al registrar el usuario:", error);
              setError("Error al registrar el usuario en la base de datos.");
            });
        };
        
        Register(cedula, nombre, apellido, correo, clave, role);
      
      } else {
        // La clave de administrador es incorrecta
        setError("Contraseña de administrador incorrecta.");
      }
    } catch (error) {
      // Error de conexión al backend
      console.error('Error al obtener la clave de administrador (Conexión/API):', error);
      setError('Error al conectar con el servidor para la verificación de clave.');
    }
};
  const strength = getPasswordStrength(clave);
  const strengthColor =
    strength > 80 ? "green" : strength > 50 ? "orange" : "red";

  return (
    <div className={Styles.containerCreateUser}>
      <form onSubmit={handleCreateUser} className={Styles.formCreateUser}>
        <h2 className={Styles.h2CreateUser}>Crear Usuario</h2>
        <div className={Styles.containerInputsCreateUser}>
          <div className={Styles.containerLabelInput}>
            <label htmlFor="cedula">
              <span>Cedula</span>
            </label>
            <input
              type="text"
              id="cedula"
              placeholder="Cedula..."
              value={cedula ?? ""}
              onChange={(e) => setTempField("cedula", e.target.value)}
            />
          </div>

          <div className={Styles.containerLabelInput}>
            <label htmlFor="nombre">
              <span>Nombre</span>
            </label>
            <input
              type="text"
              id="nombre"
              placeholder="Nombre..."
              value={nombre}
              onChange={(e) => setTempField("nombre", e.target.value)}
            />
          </div>

          <div className={Styles.containerLabelInput}>
            <label htmlFor="apellido">
              <span>Apellido</span>
            </label>
            <input
              type="text"
              id="apellido"
              placeholder="Apellido..."
              value={apellido}
              onChange={(e) => setTempField("apellido", e.target.value)}
            />
          </div>

          <div className={Styles.containerLabelInput}>
            <label htmlFor="correo">
              <span>Correo</span>
            </label>
            <input
              type="email"
              id="correo"
              placeholder="correo..."
              value={correo}
              onChange={(e) => setTempField("correo", e.target.value)}
            />
          </div>

          <div className={Styles.containerLabelInput}>
            <label htmlFor="clave">
              <span>Contraseña</span>
            </label>
            <div className={Styles.passwordContainer}>
              <input
                type={showPassword ? "text" : "password"}
                id="clave"
                placeholder="ingresa su contraseña"
                value={clave}
                onChange={(e) => setTempField("clave", e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={Styles.togglePassword}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            <div className={Styles.strengthBarContainer}>
              <div
                className={Styles.strengthBar}
                style={{
                  width: `${Math.min(strength, 100)}%`,
                  backgroundColor: strengthColor,
                }}
              ></div>
            </div>
          </div>

          <div className={Styles.containerLabelInput}>
            <label htmlFor="repetir-contraseña">
              <span>Repetir Contraseña</span>
            </label>
            <div className={Styles.passwordContainer}>
              <input
                type={showRepeatPassword ? "text" : "password"}
                id="repetir-contraseña"
                placeholder="repita su contraseña"
                value={repeatPassword}
                onChange={(e) => setTempField("repeatPassword", e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                className={Styles.togglePassword}
              >
                {showRepeatPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            {error && !isModalOpen && <p className={Styles.error}>{error}</p>}
          </div>

          <div className={Styles.containerLabelInput}>
            <label htmlFor="role">
              <span>Tipo de usuario</span>
            </label>
            <select
              id="role"
              value={role ?? ""}
              onChange={(e) => setTempField("role", e.target.value)}
            >
              <option value="">Seleccione...</option>
              <option value="administrador">administrador</option>
              <option value="usuario">usuario</option>
            </select>
          </div>

          <button type="submit" className={Styles.buttonCreateUser}>
            Crear Usuario
          </button>
        </div>

        <Link href="/sections/login" className={Styles.linkRegister}>
          Ya tengo una cuenta
        </Link>
      </form>
      {isModalOpen && (
        <AdminModal
          onAdminSubmit={handleAdminVerification}
          error={error}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
