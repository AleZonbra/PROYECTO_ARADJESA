'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';

const UserContext = createContext();

const initialTempUser = {
  nombre: '',
  apellido: '',
  correo: '',
  clave: '',
  repeatPassword: '',
  role: '',
};

export const UserProvider = ({ children }) => {
  // Inicializar userData desde localStorage si existe (persistencia entre recargas)
  const [userData, setUserDataState] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('userData');
        return stored ? JSON.parse(stored) : null;
      }
    } catch (e) {
      // ignore
    }
    return null;
  });
  // Registrar usuario (persistente) separado de la sesión
  const [registeredUserState, setRegisteredUserState] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('registeredUser');
        return stored ? JSON.parse(stored) : null;
      }
    } catch (e) {
      // ignore
    }
    return null;
  });
  const [tempUser, setTempUser] = useState(initialTempUser);

  const setTempField = (field, value) => {
    setTempUser((prev) => ({ ...prev, [field]: value }));
  };

  const resetTempUser = () => setTempUser(initialTempUser);

  // Ensure temporary inputs are cleared when the provider mounts (app start / full reload)
  useEffect(() => {
    resetTempUser();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const storedUser = localStorage.getItem('userData');
      if (storedUser) {
        setUserDataState(JSON.parse(storedUser));
      }
      const storedRegistered = localStorage.getItem('registeredUser');
      if (storedRegistered) {
        setRegisteredUserState(JSON.parse(storedRegistered));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Sincronizar userData con localStorage
  useEffect(() => {
    try {
      if (userData) {
        localStorage.setItem('userData', JSON.stringify(userData));
      } else {
        localStorage.removeItem('userData');
      }
    } catch (e) {
      // ignore
    }
  }, [userData]);

  // Sincronizar registeredUser con localStorage
  useEffect(() => {
    try {
      if (registeredUserState) {
        localStorage.setItem('registeredUser', JSON.stringify(registeredUserState));
      } else {
        localStorage.removeItem('registeredUser');
      }
    } catch (e) {
      // ignore
    }
  }, [registeredUserState]);

  // Wrapper para setUserData que actualiza el state interno
  const setUserData = (data) => {
    setUserDataState(data);
    // también intentamos escribir inmediatamente (useEffect también lo hará)
    try {
      if (typeof window !== 'undefined') {
        if (data) localStorage.setItem('userData', JSON.stringify(data));
        else localStorage.removeItem('userData');
      }
    } catch (e) {
      // ignore
    }
  };

  const setRegisteredUser = (data) => {
    setRegisteredUserState(data);
    try {
      if (typeof window !== 'undefined') {
        if (data) localStorage.setItem('registeredUser', JSON.stringify(data));
        else localStorage.removeItem('registeredUser');
      }
    } catch (e) {
      // ignore
    }
  };

  return (
    <UserContext.Provider value={{ userData, setUserData, registeredUser: registeredUserState, setRegisteredUser, tempUser, setTempField, resetTempUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
