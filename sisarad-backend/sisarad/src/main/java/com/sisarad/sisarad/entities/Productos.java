package com.sisarad.sisarad.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "productos")
public class Productos {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "producto")
	private String producto;

	@Column(name = "serial_lote")
	private String serialLote;

	@Column(name = "cantidad")
	private Integer cantidad;

	@Column(name = "fecha_produccion")
	private String fechaProduccion;

	@Column(name = "fecha_expiracion")
	private String fechaExpiracion;

	public Productos() {
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getProducto() {
		return producto;
	}

	public void setProducto(String producto) {
		this.producto = producto;
	}

	public String getSerialLote() {
		return serialLote;
	}

	public void setSerialLote(String serialLote) {
		this.serialLote = serialLote;
	}

	public Integer getCantidad() {
		return cantidad;
	}

	public void setCantidad(Integer cantidad) {
		this.cantidad = cantidad;
	}

	public String getFechaProduccion() {
		return fechaProduccion;
	}

	public void setFechaProduccion(String fechaProduccion) {
		this.fechaProduccion = fechaProduccion;
	}

	public String getFechaExpiracion() {
		return fechaExpiracion;
	}

	public void setFechaExpiracion(String fechaExpiracion) {
		this.fechaExpiracion = fechaExpiracion;
	}
}
