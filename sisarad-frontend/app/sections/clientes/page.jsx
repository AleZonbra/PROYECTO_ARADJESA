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
const emptyForm = { nombre: "", telefono: "", correo: "", direccion: "" };

export default function ClientesPage() {
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
      const response = await axios.get(apiEndPoin.clientes.listar);
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error al cargar clientes:", error);
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
      item.correo?.toLowerCase().includes(term) ||
      item.telefono?.toLowerCase().includes(term)
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
      telefono: item.telefono || "",
      correo: item.correo || "",
      direccion: item.direccion || "",
    });
    setFormError("");
    setShowModal(true);
  };

  const validateForm = () => {
    if (!form.nombre.trim() || !form.telefono.trim() || !form.correo.trim() || !form.direccion.trim()) {
      setFormError("Complete todos los campos obligatorios.");
      return false;
    }
    return true;
  };

  const saveItem = async () => {
    if (!validateForm()) return;
    const payload = {
      nombre: form.nombre.trim().toUpperCase(),
      telefono: form.telefono.trim().toUpperCase(),
      correo: form.correo.trim().toUpperCase(),
      direccion: form.direccion.trim().toUpperCase(),
    };
    try {
      if (selectedId) {
        await axios.put(apiEndPoin.clientes.actualizar.replace("{id}", selectedId), payload);
      } else {
        await axios.post(apiEndPoin.clientes.crear, payload);
      }
      setShowModal(false);
      await fetchItems();
    } catch (error) {
      console.error("Error al guardar cliente:", error);
      setFormError("No se pudo guardar el cliente.");
    }
  };

  const deleteItem = async (id) => {
    if (!confirm("¿Eliminar este cliente?")) return;
    try {
      await axios.delete(apiEndPoin.clientes.eliminar.replace("{id}", id));
      await fetchItems();
    } catch (error) {
      console.error("Error al eliminar cliente:", error);
      alert("No se pudo eliminar el cliente.");
    }
  };

  if (!isClient || !userData) return null;

  return (
    <div className={Styles.page}>
      <h1 className={Styles.title}>Módulo de Clientes</h1>
      <div className={Styles.toolbar}>
        <input
          className={Styles.searchInput}
          placeholder="Buscar cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className={Styles.buttonPrimary} onClick={openCreate}>
          Registrar cliente
        </button>
      </div>
      <div className={Styles.panel}>
        <div className={Styles.tableWrapper}>
        <table className={Styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Correo</th>
              <th>Dirección</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.length === 0 ? (
              <tr>
                <td colSpan="6" className={Styles.emptyRow}>
                  No hay clientes registrados.
                </td>
              </tr>
            ) : (
              paginatedItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.nombre}</td>
                  <td>{item.telefono}</td>
                  <td>{item.correo}</td>
                  <td>{item.direccion}</td>
                  <td className={Styles.actionCell}>
                    <button className={Styles.buttonSecondary} onClick={() => openEdit(item)}>Editar</button>{" "}
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
            <h2>{selectedId ? "Modificar cliente" : "Registrar cliente"}</h2>
            <div className={Styles.formGrid}>
              <label>Nombre<input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></label>
              <label>Teléfono<input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} /></label>
              <label>Correo<input value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} /></label>
              <label>Dirección<input value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} /></label>
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
