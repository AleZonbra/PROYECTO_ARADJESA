"use client";

import React, { useState, useCallback } from "react";
import { UserProvider, useUser } from "../context/UserContext";
import Header from "./header/page";
import NavBar from "./nav";
import Footer from "./footer/page";

function AppShell({ children }) {
  const { userData } = useUser();
  const [isNavOpen, setIsNavOpen] = useState(false);

  const toggleMenu = useCallback(() => {
    setIsNavOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsNavOpen(false);
  }, []);

  return (
    <>
      <Header navOpen={isNavOpen} toggleMenu={toggleMenu} />
      <div className="appBody">
        <NavBar navOpen={isNavOpen} closeMenu={closeMenu} />
        <main id="main" className={userData ? "mainAuthenticated" : "mainPublic"}>
          {children}
        </main>
      </div>
      <Footer />
    </>
  );
}

export default function ClientAppWrapper({ children }) {
  return (
    <UserProvider>
      <AppShell>{children}</AppShell>
    </UserProvider>
  );
}
