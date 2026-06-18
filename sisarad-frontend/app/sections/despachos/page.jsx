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
  productoId: "",
  vendedorId: "",
  clienteId: "",
  cantidad: "",
  estadoDespacho: "POR ENTREGAR",
};

export default function DespachosPage() {
  const { userData } = useUser();
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [productos, setProductos] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [ultimo, setUltimo] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [selectedId, setSelectedId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState("");
  const [isClient, setIsClient] = useState(false);

  const fetchAll = async () => {
    try {
      const [movRes, prodRes, vendRes, clieRes] = await Promise.all([
        axios.get(apiEndPoin.movimientos.listar),
        axios.get(apiEndPoin.productos.listar),
        axios.get(apiEndPoin.vendedores.listar),
        axios.get(apiEndPoin.clientes.listar),
      ]);
      setItems(Array.isArray(movRes.data) ? movRes.data : []);
      setProductos(Array.isArray(prodRes.data) ? prodRes.data : []);
      setVendedores(Array.isArray(vendRes.data) ? vendRes.data : []);
      setClientes(Array.isArray(clieRes.data) ? clieRes.data : []);
      try {
        const ultimoRes = await axios.get(apiEndPoin.movimientos.ultimo);
        setUltimo(ultimoRes.data);
      } catch {
        setUltimo(null);
      }
    } catch (error) {
      console.error("Error al cargar despachos:", error);
      setItems([]);
    }
  };

  useEffect(() => setIsClient(true), []);
  useEffect(() => {
    if (!isClient) return;
    if (!userData) router.replace("/");
  }, [isClient, userData, router]);
  useEffect(() => {
    if (userData) fetchAll();
  }, [userData]);

  const filtered = items.filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      String(item.id).includes(term) ||
      item.producto?.producto?.toLowerCase().includes(term) ||
      item.vendedor?.nombre?.toLowerCase().includes(term) ||
      item.cliente?.nombre?.toLowerCase().includes(term) ||
      item.estadoDespacho?.toLowerCase().includes(term)
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
      productoId: String(item.producto?.id || ""),
      vendedorId: String(item.vendedor?.id || ""),
      clienteId: String(item.cliente?.id || ""),
      cantidad: String(item.cantidad || ""),
      estadoDespacho: item.estadoDespacho || "POR ENTREGAR",
    });
    setFormError("");
    setShowModal(true);
  };

  const validateForm = () => {
    if (!form.productoId || !form.vendedorId || !form.clienteId || !form.cantidad) {
      setFormError("Seleccione producto, vendedor, cliente y cantidad.");
      return false;
    }
    if (Number(form.cantidad) <= 0 || Number.isNaN(Number(form.cantidad))) {
      setFormError("La cantidad debe ser mayor a cero.");
      return false;
    }
    return true;
  };

  const saveItem = async () => {
    if (!validateForm()) return;
    const payload = {
      producto: { id: Number(form.productoId) },
      vendedor: { id: Number(form.vendedorId) },
      cliente: { id: Number(form.clienteId) },
      cantidad: Number(form.cantidad),
      estadoDespacho: form.estadoDespacho,
    };
    try {
      if (selectedId) {
        await axios.put(apiEndPoin.movimientos.actualizar.replace("{id}", selectedId), payload);
      } else {
        await axios.post(apiEndPoin.movimientos.crear, payload);
      }
      setShowModal(false);
      await fetchAll();
    } catch (error) {
      console.error("Error al guardar despacho:", error);
      const msg = error.response?.data || "No se pudo guardar el despacho. Verifique el inventario.";
      setFormError(typeof msg === "string" ? msg : "No se pudo guardar el despacho.");
    }
  };

  const deleteItem = async (id) => {
    if (!confirm("¿Eliminar este despacho?")) return;
    try {
      await axios.delete(apiEndPoin.movimientos.eliminar.replace("{id}", id));
      await fetchAll();
    } catch (error) {
      console.error("Error al eliminar despacho:", error);
      alert("No se pudo eliminar el despacho.");
    }
  };

  if (!isClient || !userData) return null;

  return (
    <div className={Styles.page}>
      <h1 className={Styles.title}>Historial y Despachos</h1>

      <div className={`${Styles.panel} ${Styles.panelHighlight}`}>
        <strong>Último despacho:</strong>{" "}
        {ultimo
          ? `ID ${ultimo.id} | ${ultimo.producto?.producto} | ${ultimo.cliente?.nombre} | Cant. ${ultimo.cantidad} | ${ultimo.fechaSalida} | ${ultimo.estadoDespacho}`
          : "Ningún despacho registrado"}
      </div>

      <div className={Styles.toolbar}>
        <input
          className={Styles.searchInput}
          placeholder="Buscar despacho..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className={Styles.buttonPrimary} onClick={openCreate}>
          Registrar despacho
        </button>
      </div>

      <div className={Styles.panel}>
        <div className={Styles.tableWrapper}>
        <table className={Styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Producto</th>
              <th>Vendedor</th>
              <th>Cliente</th>
              <th>Cant.</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.length === 0 ? (
              <tr>
                <td colSpan="8" className={Styles.emptyRow}>
                  No hay despachos registrados.
                </td>
              </tr>
            ) : (
              paginatedItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.producto?.producto}</td>
                  <td>{item.vendedor?.nombre}</td>
                  <td>{item.cliente?.nombre}</td>
                  <td>{item.cantidad}</td>
                  <td>{item.fechaSalida}</td>
                  <td>{item.estadoDespacho}</td>
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
            <h2>{selectedId ? "Modificar despacho" : "Registrar despacho"}</h2>
            <div className={Styles.formGrid}>
              <label>
                Producto
                <select value={form.productoId} onChange={(e) => setForm({ ...form, productoId: e.target.value })}>
                  <option value="">Seleccione...</option>
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.id} - {p.producto} (stock: {p.cantidad})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Vendedor
                <select value={form.vendedorId} onChange={(e) => setForm({ ...form, vendedorId: e.target.value })}>
                  <option value="">Seleccione...</option>
                  {vendedores.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.id} - {v.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Cliente
                <select value={form.clienteId} onChange={(e) => setForm({ ...form, clienteId: e.target.value })}>
                  <option value="">Seleccione...</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.id} - {c.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Cantidad
                <input type="number" min="1" value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: e.target.value })} />
              </label>
              <label>
                Estado despacho
                <select value={form.estadoDespacho} onChange={(e) => setForm({ ...form, estadoDespacho: e.target.value })}>
                  <option value="POR ENTREGAR">POR ENTREGAR</option>
                  <option value="ENTREGADO">ENTREGADO</option>
                </select>
              </label>
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
