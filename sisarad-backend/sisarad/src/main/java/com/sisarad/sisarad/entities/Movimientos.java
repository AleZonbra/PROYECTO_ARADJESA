package com.sisarad.sisarad.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "movimientos")
public class Movimientos {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "producto_id")
	@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
	private Productos producto;

	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "vendedor_id")
	@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
	private Vendedores vendedor;

	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "cliente_id")
	@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
	private Clientes cliente;

	@Column(name = "cantidad")
	private Integer cantidad;

	@Column(name = "fecha_salida")
	private String fechaSalida;

	@Column(name = "estado_despacho")
	private String estadoDespacho;

	public Movimientos() {
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public Productos getProducto() {
		return producto;
	}

	public void setProducto(Productos producto) {
		this.producto = producto;
	}

	public Vendedores getVendedor() {
		return vendedor;
	}

	public void setVendedor(Vendedores vendedor) {
		this.vendedor = vendedor;
	}

	public Clientes getCliente() {
		return cliente;
	}

	public void setCliente(Clientes cliente) {
		this.cliente = cliente;
	}

	public Integer getCantidad() {
		return cantidad;
	}

	public void setCantidad(Integer cantidad) {
		this.cantidad = cantidad;
	}

	public String getFechaSalida() {
		return fechaSalida;
	}

	public void setFechaSalida(String fechaSalida) {
		this.fechaSalida = fechaSalida;
	}

	public String getEstadoDespacho() {
		return estadoDespacho;
	}

	public void setEstadoDespacho(String estadoDespacho) {
		this.estadoDespacho = estadoDespacho;
	}
}
