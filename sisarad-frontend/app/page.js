import styles from "./page.module.css";
import React from "react";
import LoginClient from "./components/LoginClient";

export default function Inicio() {
  return (
    <div className={styles.main}>
      <LoginClient />
    </div>
  );
}