"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import apiEndPoin from "../../../config/apiEndPointsUrl.json";
import Styles from "./page.module.css"; 

// Renombramos el componente para reflejar su nueva funcionalidad
export default function ModalActualizarUsuario({ usuario = {}, onClose = () => {} }) {
    // Protegemos `usuario` con un valor por defecto para evitar errores durante prerender
    const safeUsuario = usuario || {};
    // Inicializamos los estados con los datos del usuario existente (si existen)
    const [nombre, setNombre] = useState(safeUsuario.nombre || '');
    const [apellido, setApellido] = useState(safeUsuario.apellido || '');
    const [email, setEmail] = useState(safeUsuario.email || '');
    const [id, setId] = useState(safeUsuario.id || ''); // Si el ID (cédula) es editable
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Si el usuario cambia mientras el modal está abierto, actualiza los estados
    useEffect(() => {
        const u = usuario || {};
        setNombre(u.nombre || '');
        setApellido(u.apellido || '');
        setEmail(u.email || '');
        setId(u.id || '');
    }, [usuario]);


    const handleSubmit = async (e) => {
        e.preventDefault();

        // 1. Validar Contraseñas (solo si se intenta cambiar)
        if (newPassword || confirmPassword) {
            if (newPassword !== confirmPassword) {
                alert("Las contraseñas no coinciden.");
                return;
            }
            if (newPassword.length < 6) {
                alert("La nueva contraseña debe tener al menos 6 caracteres.");
                return;
            }
        }
        
        // 2. Construir el objeto de datos a enviar
        const dataToUpdate = {};
        
        // Comprobar y agregar solo los campos que cambiaron (o que no son el original)
        // La lógica del backend ya maneja si el campo es nulo o vacío.
        
        // ID (Cédula) - Asumiendo que solo se usa para la URL y no se cambia, pero si se puede:
        // Si el ID cambia, tendrías que enviar un objeto diferente o usar el ID original para la URL.
        // Aquí usamos el ID original para la URL, el `id` en el body es opcional según tu backend.
        // dataToUpdate.id = id; // Generalmente no se envía el ID en el body, sino en la URL.
        
        // Datos Personales (usar safeUsuario para evitar undefined)
        if (nombre !== safeUsuario.nombre) dataToUpdate.nombre = nombre;
        if (apellido !== safeUsuario.apellido) dataToUpdate.apellido = apellido;
        if (email !== safeUsuario.email) dataToUpdate.email = email;
        
        // Contraseña
        if (newPassword && newPassword === confirmPassword) {
            dataToUpdate.clave = newPassword; // El backend se encarga del hash
        }
        
        // 3. Validar si hay algo para actualizar
        if (Object.keys(dataToUpdate).length === 0) {
            alert("No se detectaron cambios para actualizar.");
            onClose();
            return;
        }

        setLoading(true);

        try {
            // Usamos el endpoint PUT configurado en apiEndPoin
            const userId = usuario?.id || id;
            const url = apiEndPoin.user.actualizarUsuario.replace("{userId}", userId);

            await axios.put(url, dataToUpdate);

            alert(`Usuario ${safeUsuario?.nombre || nombre} actualizado exitosamente.`);
            onClose();

        } catch (error) {
            console.error("Error al actualizar el usuario:", error.response?.data || error.message);
            alert(`Error al actualizar el usuario: ${error.response?.data || "Error de red/servidor"}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={Styles.modalOverlay} onClick={onClose}>
            <div className={Styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <h2>Actualizar Datos de {safeUsuario?.nombre || nombre}</h2>
                <form onSubmit={handleSubmit}>
                    
                    {/* Campos Editables */}
                    <div className={Styles.formGroup}>
                        <label htmlFor="nombre">Nombre:</label>
                        <input
                            id="nombre"
                            type="text"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                        />
                    </div>
                    <div className={Styles.formGroup}>
                        <label htmlFor="apellido">Apellido:</label>
                        <input
                            id="apellido"
                            type="text"
                            value={apellido}
                            onChange={(e) => setApellido(e.target.value)}
                        />
                    </div>
                    <div className={Styles.formGroup}>
                        <label htmlFor="email">Correo (Email):</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    
                    {/* Campos de Contraseña (Opcionales) */}
                    <hr style={{margin: '15px 0', borderColor: '#ccc'}}/>
                    <h3>Cambiar Contraseña (Opcional)</h3>
                    <div className={Styles.formGroup}>
                        <label htmlFor="newPassword">Nueva Contraseña:</label>
                        <input
                            id="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            minLength="6"
                            placeholder="Dejar vacío para no cambiar"
                        />
                    </div>
                    <div className={Styles.formGroup}>
                        <label htmlFor="confirmPassword">Confirmar Contraseña:</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Dejar vacío para no cambiar"
                        />
                    </div>
                    
                    <div className={Styles.buttonContainer}>
                        <button type="submit" disabled={loading}>
                            {loading ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                        <button type="button" onClick={onClose} disabled={loading}>
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}