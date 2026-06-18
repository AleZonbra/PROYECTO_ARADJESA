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
const emptyForm = {
  producto: "",
  serialLote: "",
  cantidad: "",
  fechaProduccion: "",
  fechaExpiracion: "",
};

export default function ProductosPage() {
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
      const response = await axios.get(apiEndPoin.productos.listar);
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error al cargar productos:", error);
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
      item.producto?.toLowerCase().includes(term) ||
      item.serialLote?.toLowerCase().includes(term)
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
      producto: item.producto || "",
      serialLote: item.serialLote || "",
      cantidad: String(item.cantidad ?? ""),
      fechaProduccion: item.fechaProduccion || "",
      fechaExpiracion: item.fechaExpiracion || "",
    });
    setFormError("");
    setShowModal(true);
  };

  const validateForm = () => {
    if (!form.producto.trim() || !form.serialLote.trim() || !form.cantidad.trim()) {
      setFormError("Complete todos los campos obligatorios.");
      return false;
    }
    if (Number(form.cantidad) < 0 || Number.isNaN(Number(form.cantidad))) {
      setFormError("La cantidad debe ser un número válido.");
      return false;
    }
    return true;
  };

  const saveItem = async () => {
    if (!validateForm()) return;
    const payload = {
      producto: form.producto.trim().toUpperCase(),
      serialLote: form.serialLote.trim().toUpperCase(),
      cantidad: Number(form.cantidad),
      fechaProduccion: form.fechaProduccion,
      fechaExpiracion: form.fechaExpiracion,
    };
    try {
      if (selectedId) {
        await axios.put(apiEndPoin.productos.actualizar.replace("{id}", selectedId), payload);
      } else {
        await axios.post(apiEndPoin.productos.crear, payload);
      }
      setShowModal(false);
      await fetchItems();
    } catch (error) {
      console.error("Error al guardar producto:", error);
      setFormError("No se pudo guardar el producto. Verifique los datos.");
    }
  };

  const deleteItem = async (id) => {
    if (!confirm("¿Eliminar este producto?")) return;
    try {
      await axios.delete(apiEndPoin.productos.eliminar.replace("{id}", id));
      await fetchItems();
    } catch (error) {
      console.error("Error al eliminar producto:", error);
      alert("No se pudo eliminar el producto.");
    }
  };

  if (!isClient || !userData) return null;

  return (
    <div className={Styles.page}>
      <h1 className={Styles.title}>Módulo de Productos</h1>
      <div className={Styles.toolbar}>
        <input
          className={Styles.searchInput}
          placeholder="Buscar producto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className={Styles.buttonPrimary} onClick={openCreate}>
          Registrar producto
        </button>
      </div>

      <div className={Styles.panel}>
        <div className={Styles.tableWrapper}>
        <table className={Styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Producto</th>
              <th>Serial/Lote</th>
              <th>Cantidad</th>
              <th>F. Producción</th>
              <th>F. Expiración</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.length === 0 ? (
              <tr>
                <td colSpan="7" className={Styles.emptyRow}>
                  No hay productos registrados.
                </td>
              </tr>
            ) : (
              paginatedItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.producto}</td>
                  <td>{item.serialLote}</td>
                  <td>{item.cantidad}</td>
                  <td>{item.fechaProduccion}</td>
                  <td>{item.fechaExpiracion}</td>
                  <td className={Styles.actionCell}>
                    <button className={Styles.buttonSecondary} onClick={() => openEdit(item)}>
                      Editar
                    </button>{" "}
                    <button className={Styles.buttonDanger} onClick={() => deleteItem(item.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={setCurrentPage}
        />
      </div>

      {showModal && (
        <div className={Styles.modalOverlay}>
          <div className={Styles.modal}>
            <h2>{selectedId ? "Modificar producto" : "Registrar producto"}</h2>
            <div className={Styles.formGrid}>
              <label>
                Producto
                <input value={form.producto} onChange={(e) => setForm({ ...form, producto: e.target.value })} />
              </label>
              <label>
                Serial/Lote
                <input value={form.serialLote} onChange={(e) => setForm({ ...form, serialLote: e.target.value })} />
              </label>
              <label>
                Cantidad
                <input type="number" min="0" value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: e.target.value })} />
              </label>
              <label>
                F. Producción (DD/MM/AAAA)
                <input value={form.fechaProduccion} onChange={(e) => setForm({ ...form, fechaProduccion: e.target.value })} />
              </label>
              <label>
                F. Expiración (DD/MM/AAAA)
                <input value={form.fechaExpiracion} onChange={(e) => setForm({ ...form, fechaExpiracion: e.target.value })} />
              </label>
            </div>
            {formError && <p className={Styles.formError}>{formError}</p>}
            <div className={Styles.modalActions}>
              <button className={Styles.buttonSecondary} onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button className={Styles.buttonPrimary} onClick={saveItem}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
