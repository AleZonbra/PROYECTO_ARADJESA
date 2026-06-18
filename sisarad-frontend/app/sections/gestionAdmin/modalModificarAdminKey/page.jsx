// app/sections/gestionContrasenas/modalModificarAdminKey/page.jsx

"use client";
import React, { useState } from 'react';
import axios from 'axios';
import apiEndPoin from "../../../config/apiEndPointsUrl.json";
import Styles from "../modalCambiarContrasena/page.module.css"; 

export default function ModalModificarAdminKey({ onClose }) {
    const [currentKey, setCurrentKey] = useState('');
    const [newKey, setNewKey] = useState('');
    const [confirmNewKey, setConfirmNewKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // 1. Verificaciones locales
        if (newKey.length < 8) {
            setError("La nueva Clave Maestra debe tener al menos 8 caracteres.");
            return;
        }

        if (newKey !== confirmNewKey) {
            setError("La nueva clave y su confirmación no coinciden.");
            return;
        }
        
        setLoading(true);

        try {
            // =========================================================
            // PASO 1: ⚠️ INSEGURO: Obtener la clave/hash existente del backend (SOLICITADO POR EL USUARIO)
            // =========================================================
            const keyResponse = await axios.get(apiEndPoin.admin.obtenerClaveAdmin);
            
            // Asumiendo que el backend devuelve un array con un objeto que tiene la propiedad 'clave' (según tu ejemplo)
            const adminKeyFromBackend = keyResponse.data[0]?.clave; 

            if (!adminKeyFromBackend) {
                setError("Error: El servidor no proporcionó la clave maestra. Revise el backend.");
                setLoading(false);
                return;
            }

            // =========================================================
            // PASO 2: Comparar la clave actual introducida con la clave del backend
            // =========================================================
            // NOTA: Si esta clave estuviera hasheada, necesitarías una librería de comparación de hashes aquí (ej: 'bcryptjs').
            // Por simplicidad y siguiendo tu ejemplo, usamos comparación directa.
            if (currentKey !== adminKeyFromBackend) {
                setError("La Clave Maestra Actual es incorrecta.");
                setLoading(false);
                return;
            }

            // =========================================================
            // PASO 3: Si la verificación es exitosa, enviar la nueva clave al backend para modificarla
            // =========================================================
            await axios.post(
                apiEndPoin.admin.crearOMofidicarClaveAdmin, 
                {
                    id: 1,
                    clave: newKey,
                }
            );
            
            alert("¡La Clave Maestra de Seguridad de la aplicación ha sido modificada con éxito!");
            onClose();

        } catch (err) {
            console.error("Error en la gestión de la Clave Maestra:", err.response ? err.response.data : err.message);
            // Capturar errores en la solicitud GET o PUT
            const backendError = err.response?.data?.message || "Error de servidor al procesar la clave maestra.";
            setError(backendError);
            
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={Styles.modalOverlay} onClick={onClose}>
            <div className={Styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <h2>⚙️ Modificar Clave Maestra de Aplicación</h2>
                <form onSubmit={handleSubmit}>
                    
                    {/* Campo de Clave Actual (Se usa para la comparación local) */}
                    <div className={Styles.formGroup}>
                        <label htmlFor="currentKey">Clave Maestra Actual:</label>
                        <input
                            id="currentKey"
                            type="password"
                            value={currentKey}
                            onChange={(e) => setCurrentKey(e.target.value)}
                            required
                            placeholder="Clave de seguridad única actual"
                        />
                    </div>

                    {/* Campo de Nueva Clave */}
                    <div className={Styles.formGroup}>
                        <label htmlFor="newKey">Nueva Clave Maestra:</label>
                        <input
                            id="newKey"
                            type="password"
                            value={newKey}
                            onChange={(e) => setNewKey(e.target.value)}
                            required
                            minLength="8"
                            placeholder="Mínimo 8 caracteres para la nueva clave"
                        />
                    </div>
                    
                    {/* Campo de Confirmar Nueva Clave */}
                    <div className={Styles.formGroup}>
                        <label htmlFor="confirmNewKey">Confirmar Nueva Clave:</label>
                        <input
                            id="confirmNewKey"
                            type="password"
                            value={confirmNewKey}
                            onChange={(e) => setConfirmNewKey(e.target.value)}
                            required
                            placeholder="Confirmar nueva clave"
                        />
                    </div>
                    
                    {error && <p className={Styles.errorMessage} style={{ color: '#c53030' }}>{error}</p>}

                    <div className={Styles.buttonContainer}>
                        <button type="submit" disabled={loading}>
                            {loading ? 'Verificando y Guardando...' : 'Guardar Nueva Clave'}
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