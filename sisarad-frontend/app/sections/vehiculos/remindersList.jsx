"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import apiEndPoin from "../../config/apiEndPointsUrl.json";
import Style from "./page.module.css";

function EditReminderModal({ reminder, onSaved, onClose }) {
  const [tipo, setTipo] = useState(reminder?.tipo || "DISTANCE");
  const [parametroKm, setParametroKm] = useState(reminder?.parametroKm || 10000);
  const [parametroDias, setParametroDias] = useState(reminder?.parametroDias || 180);
  const [descripcion, setDescripcion] = useState(reminder?.descripcion || "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const template = apiEndPoin.reminders && apiEndPoin.reminders.update;
      const url = template
        ? template.replace('{id}', String(reminder.id))
        : `https://samva-3m16.onrender.com/reminders/update/${reminder.id}`;
      await axios.put(url, {
        tipo, parametroKm, parametroDias, descripcion, enabled: true
      });
      if (typeof onSaved === 'function') onSaved();
      if (typeof onClose === 'function') onClose();
    } catch (e) { console.error(e); alert('Error actualizando'); }
    finally { setLoading(false); }
  };

  return (
    <div className={Style.overlay} onClick={onClose}>
      <div className={Style.modal} onClick={(e)=>e.stopPropagation()}>
        <h4>Editar recordatorio</h4>
        <label>Tipo</label>
        <select value={tipo} onChange={(e)=>setTipo(e.target.value)}>
          <option value="DISTANCE">Por Kilómetros</option>
          <option value="TIME">Por Tiempo</option>
          <option value="HYBRID">Híbrido</option>
        </select>
        <label>Km</label>
        <input type="number" value={parametroKm} onChange={(e)=>setParametroKm(parseInt(e.target.value))} />
        <label>Días</label>
        <input type="number" value={parametroDias} onChange={(e)=>setParametroDias(parseInt(e.target.value))} />
        <label>Descripción</label>
        <input value={descripcion} onChange={(e)=>setDescripcion(e.target.value)} />
        <div style={{display:'flex', gap:8, marginTop:10}}>
          <button onClick={onClose}>Cancelar</button>
          <button onClick={handleSave} disabled={loading}>{loading? 'Guardando...':'Guardar'}</button>
        </div>
      </div>
    </div>
  );
}

export default function RemindersList({ vehiculoId, refreshKey }) {
  const [reminders, setReminders] = useState([]);
  const [editing, setEditing] = useState(null);

  const fetch = async () => {
    if (!vehiculoId) return;
    try {
      const template = apiEndPoin.reminders && apiEndPoin.reminders.getByVehiculo;
      const url = template
        ? template.replace('{vehiculoId}', String(vehiculoId))
        : `https://samva-3m16.onrender.com/reminders/vehiculo?vehiculoId=${vehiculoId}`;
      const res = await axios.get(url);
      setReminders(res.data || []);
    } catch (e) { console.error(e); }
  };

  useEffect(()=>{ fetch(); }, [vehiculoId, refreshKey]);

  const handleDelete = async (id) => {
    if (!confirm('Eliminar recordatorio?')) return;
    try {
      const template = apiEndPoin.reminders && apiEndPoin.reminders.delete;
      const url = template
        ? template.replace('{id}', String(id))
        : `https://samva-3m16.onrender.com/reminders/delete/${id}`;
      await axios.delete(url);
      fetch();
    } catch(e){ console.error(e); alert('Error eliminando'); }
  };

  return (
    <section className={Style.remindersSection}>
      <h4 className={Style.remindersTitle}>Recordatorios</h4>
      {reminders.length === 0 && (
        <p className={Style.remindersEmpty}>No hay recordatorios configurados.</p>
      )}
      {reminders.length > 0 && (
        <ul className={Style.remindersList}>
          {reminders.map((r) => (
            <li key={r.id} className={Style.reminderItem}>
              <div className={Style.reminderMain}>
                <div className={Style.reminderTitle}>{r.descripcion || r.tipo}</div>
                            <div className={Style.reminderMeta}>
                              Km: {r.parametroKm || "-"} • Días: {r.parametroDias || "-"}
                </div>
              </div>
              <div className={Style.reminderActions}>
                <button
                  type="button"
                  className={Style.reminderButton}
                  onClick={() => setEditing(r)}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className={`${Style.reminderButton} ${Style.reminderButtonDanger}`}
                  onClick={() => handleDelete(r.id)}
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <EditReminderModal reminder={editing} onSaved={fetch} onClose={()=>setEditing(null)} />
      )}
    </section>
  );
}
