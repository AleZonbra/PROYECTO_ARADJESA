"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import apiEndPoin from "../../config/apiEndPointsUrl.json";
import Style from "./page.module.css";

export default function NotificationsList({ vehiculoId }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetch = async () => {
    if (!vehiculoId) return;
    setLoading(true);
    try {
      const template = apiEndPoin.notifications && apiEndPoin.notifications.getByVehiculo;
      const url = template
        ? template.replace('{vehiculoId}', String(vehiculoId))
        : `https://samva-3m16.onrender.com/notifications/vehiculo?vehiculoId=${vehiculoId}`;
      const res = await axios.get(url);
      setNotifications(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, [vehiculoId]);

  const markRead = async (id) => {
    try {
      const template = apiEndPoin.notifications && apiEndPoin.notifications.markRead;
      const url = template
        ? template.replace('{id}', String(id))
        : `https://samva-3m16.onrender.com/notifications/${id}/read`;
      await axios.put(url);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, leido: true } : n)));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <section className={Style.notificationsSectionVehiculo}>
      <h4 className={Style.notificationsTitleVehiculo}>Notificaciones</h4>
      {loading ? (
        <p className={Style.notificationsEmptyVehiculo}>Cargando...</p>
      ) : notifications.length === 0 ? (
        <p className={Style.notificationsEmptyVehiculo}>No hay notificaciones.</p>
      ) : (
        <ul className={Style.notificationsListVehiculo}>
          {notifications.map((n) => (
            <li key={n.id} className={Style.notificationItemVehiculo}>
              <div className={Style.notificationMainVehiculo}>
                <div className={Style.notificationTitleVehiculo}>{n.mensaje}</div>
                <div className={Style.notificationMetaVehiculo}>
                  {new Date(n.createdAt).toLocaleString()}
                </div>
              </div>
              <div className={Style.notificationActionsVehiculo}>
                {!n.leido ? (
                  <button
                    type="button"
                    className={Style.notificationButtonVehiculo}
                    onClick={() => markRead(n.id)}
                  >
                    Marcar leído
                  </button>
                ) : (
                  <span className={Style.notificationStatusVehiculo}>Leído</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
