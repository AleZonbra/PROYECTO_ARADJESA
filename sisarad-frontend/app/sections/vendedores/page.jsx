"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useUser } from "../../context/UserContext";
import apiEndPoin from "../../config/apiEndPointsUrl.json";
import Styles from "../shared.module.css";
import Pagination from "../../components/Pagination";
import usePagination from "../../hooks/usePagination";

const ITEMS_PER_PAGE = 10;
const emptyForm = { nombre: "", numEmpleado: "", trabajosRealizados: "" };

export default function VendedoresPage() {
  const { userData } = useUser();
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [selectedId, setSelectedId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState("");
  const [isClient, setIsClient] = useState(false);

  const fetchItems = async () => {
    try {
      const response = await axios.get(apiEndPoin.vendedores.listar);
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error al cargar vendedores:", error);
      setItems([]);
    }
  };

  useEffect(() => setIsClient(true), []);
  useEffect(() => {
    if (!isClient) return;
    if (!userData) router.replace("/");
  }, [isClient, userData, router]);
  useEffect(() => {
    if (userData) fetchItems();
  }, [userData]);

  const filtered = items.filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      String(item.id).includes(term) ||
      item.nombre?.toLowerCase().includes(term) ||
      item.numEmpleado?.toLowerCase().includes(term)
    );
  });

  const { currentPage, setCurrentPage, totalPages, paginatedItems, totalItems } = usePagination(
    filtered,
    ITEMS_PER_PAGE,
    [searchTerm]
  );

  const openCreate = () => {
    setSelectedId(null);
    setForm(emptyForm);
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (item) => {
    setSelectedId(item.id);
    setForm({
      nombre: item.nombre || "",
      numEmpleado: item.numEmpleado || "",
      trabajosRealizados: item.trabajosRealizados || "",
    });
    setFormError("");
    setShowModal(true);
  };

  const validateForm = () => {
    if (!form.nombre.trim() || !form.numEmpleado.trim() || !form.trabajosRealizados.trim()) {
      setFormError("Complete todos los campos obligatorios.");
      return false;
    }
    return true;
  };

  const saveItem = async () => {
    if (!validateForm()) return;
    const payload = {
      nombre: form.nombre.trim().toUpperCase(),
      numEmpleado: form.numEmpleado.trim().toUpperCase(),
      trabajosRealizados: form.trabajosRealizados.trim().toUpperCase(),
    };
    try {
      if (selectedId) {
        await axios.put(apiEndPoin.vendedores.actualizar.replace("{id}", selectedId), payload);
      } else {
        await axios.post(apiEndPoin.vendedores.crear, { ...payload, estado: "ACTIVO" });
      }
      setShowModal(false);
      await fetchItems();
    } catch (error) {
      console.error("Error al guardar vendedor:", error);
      setFormError("No se pudo guardar el vendedor.");
    }
  };

  const toggleEstado = async (id) => {
    try {
      await axios.put(apiEndPoin.vendedores.alternarEstado.replace("{id}", id));
      await fetchItems();
    } catch (error) {
      console.error("Error al alternar estado:", error);
      alert("No se pudo cambiar el estado.");
    }
  };

  const deleteItem = async (id) => {
    if (!confirm("¿Eliminar este vendedor?")) return;
    try {
      await axios.delete(apiEndPoin.vendedores.eliminar.replace("{id}", id));
      await fetchItems();
    } catch (error) {
      console.error("Error al eliminar vendedor:", error);
      alert("No se pudo eliminar el vendedor.");
    }
  };

  if (!isClient || !userData) return null;

  return (
    <div className={Styles.page}>
      <h1 className={Styles.title}>Módulo de Vendedores</h1>
      <div className={Styles.toolbar}>
        <input
          className={Styles.searchInput}
          placeholder="Buscar vendedor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className={Styles.buttonPrimary} onClick={openCreate}>
          Registrar vendedor
        </button>
      </div>
      <div className={Styles.panel}>
        <div className={Styles.tableWrapper}>
        <table className={Styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>N° Empleado</th>
              <th>Trabajos</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.length === 0 ? (
              <tr>
                <td colSpan="6" className={Styles.emptyRow}>
                  No hay vendedores registrados.
                </td>
              </tr>
            ) : (
              paginatedItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.nombre}</td>
                  <td>{item.numEmpleado}</td>
                  <td>{item.trabajosRealizados}</td>
                  <td>
                    <span className={`${Styles.badge} ${item.estado === "ACTIVO" ? Styles.badgeActive : Styles.badgeInactive}`}>
                      {item.estado}
                    </span>
                  </td>
                  <td className={Styles.actionCell}>
                    <button className={Styles.buttonSecondary} onClick={() => openEdit(item)}>Editar</button>{" "}
                    <button className={Styles.buttonSecondary} onClick={() => toggleEstado(item.id)}>Alternar estado</button>{" "}
                    <button className={Styles.buttonDanger} onClick={() => deleteItem(item.id)}>Eliminar</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} onPageChange={setCurrentPage} />
      </div>

      {showModal && (
        <div className={Styles.modalOverlay}>
          <div className={Styles.modal}>
            <h2>{selectedId ? "Modificar vendedor" : "Registrar vendedor"}</h2>
            <div className={Styles.formGrid}>
              <label>Nombre<input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></label>
              <label>N° Empleado<input value={form.numEmpleado} onChange={(e) => setForm({ ...form, numEmpleado: e.target.value })} /></label>
              <label>Trabajos<input value={form.trabajosRealizados} onChange={(e) => setForm({ ...form, trabajosRealizados: e.target.value })} /></label>
            </div>
            {formError && <p className={Styles.formError}>{formError}</p>}
            <div className={Styles.modalActions}>
              <button className={Styles.buttonSecondary} onClick={() => setShowModal(false)}>Cancelar</button>
              <button className={Styles.buttonPrimary} onClick={saveItem}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
