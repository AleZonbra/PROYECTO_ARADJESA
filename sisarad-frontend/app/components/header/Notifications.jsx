"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import apiEndPoin from "../../config/apiEndPointsUrl.json";
import Styles from "./page.module.css";

export default function Notifications() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    try {
      const url = (apiEndPoin.notifications && apiEndPoin.notifications.getAll) || "https://samva-3m16.onrender.com/notifications/all";
      const res = await axios.get(url);
      setNotifications(res.data || []);
    } catch (e) {
      console.error("Error al cargar notificaciones", e);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markRead = async (id) => {
    try {
      const template = apiEndPoin.notifications && apiEndPoin.notifications.markRead;
      const url = template
        ? template.replace("{id}", String(id))
        : `https://samva-3m16.onrender.com/notifications/${id}/read`;
      await axios.put(url);
      setNotifications((prev) => prev.map(n => n.id === id ? { ...n, leido: true } : n));
    } catch (e) {
      console.error("Error al marcar notificación como leída", e);
    }
  };

  const unreadCount = notifications.filter(n => !n.leido).length;

  return (
    <div className={Styles.notificationsContainer}>
      <button className={Styles.bellButton} onClick={()=>{ setOpen(!open); if(!open) fetchNotifications(); }} title="Notificaciones">
        🔔 {unreadCount > 0 && <span className={Styles.badge}>{unreadCount}</span>}
      </button>
      {open && (
        <div className={Styles.dropdown}>
          <h4>Notificaciones</h4>
          {notifications.length === 0 && (
            <p className={Styles.dropdownEmpty}>No hay notificaciones.</p>
          )}
          {notifications.length > 0 && (
            <ul className={Styles.dropdownList}>
              {notifications.map((n) => (
                <li key={n.id} className={Styles.dropdownItem}>
                  <div className={Styles.dropdownMain}>
                    <div className={Styles.dropdownTitle}>{n.mensaje}</div>
                    <div className={Styles.dropdownMeta}>{new Date(n.createdAt).toLocaleString()}</div>
                  </div>
                  <div className={Styles.dropdownActions}>
                    {!n.leido ? (
                      <button
                        type="button"
                        className={Styles.dropdownButton}
                        onClick={() => markRead(n.id)}
                      >
                        Marcar leído
                      </button>
                    ) : (
                      <span className={Styles.dropdownStatus}>Leído</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
