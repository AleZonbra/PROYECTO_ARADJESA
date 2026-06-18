"use client";
import React from "react";
import { usePathname, useRouter } from "next/navigation";
import Styles from "./page.module.css";
import { useUser } from "../../context/UserContext";

const MENU = [
  { label: "Inicio", path: "/sections/home" },
  { label: "Productos", path: "/sections/productos" },
  { label: "Vendedores", path: "/sections/vendedores" },
  { label: "Proveedores", path: "/sections/proveedores" },
  { label: "Clientes", path: "/sections/clientes" },
  { label: "Despachos", path: "/sections/despachos" },
];

export default function NavBar({ navOpen = false, closeMenu }) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const { userData } = useUser();
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLinkClick = (path) => {
    if (typeof closeMenu === "function") closeMenu();
    router.push(path);
  };

  if (!isClient || !userData) return null;

  const isActive = (path) => pathname.startsWith(path);

  return (
    <div className={Styles.navContainer}>
      <div
        className={`${Styles.navBackdrop} ${navOpen ? Styles.navBackdropVisible : ""}`}
        onClick={() => typeof closeMenu === "function" && closeMenu()}
      />
      <nav className={`${Styles.navBar} ${navOpen ? Styles.navBarOpen : ""}`}>
        <button
          className={Styles.closeButton}
          onClick={() => typeof closeMenu === "function" && closeMenu()}
          aria-label="Cerrar menú"
        >
          ✕
        </button>
        <ul className={Styles.ulNavBar}>
          {MENU.map((item) => (
            <li
              key={item.path}
              className={`${Styles.liNavBar} ${isActive(item.path) ? Styles.active : ""}`}
              onClick={() => handleLinkClick(item.path)}
            >
              {item.label}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
