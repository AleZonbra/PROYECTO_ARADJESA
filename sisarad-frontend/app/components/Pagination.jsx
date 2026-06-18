"use client";
import React from "react";
import Styles from "../sections/shared.module.css";

export default function Pagination({ currentPage, totalPages, onPageChange, totalItems }) {
  if (totalItems === 0) return null;

  return (
    <div className={Styles.pagination}>
      <button
        type="button"
        className={Styles.paginationButton}
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Anterior
      </button>
      <span className={Styles.paginationInfo}>
        Página {currentPage} de {totalPages} ({totalItems} registros)
      </span>
      <button
        type="button"
        className={Styles.paginationButton}
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Siguiente
      </button>
    </div>
  );
}
