package com.sisarad.sisarad.model;

import java.util.ArrayList;
import java.util.List;

import com.sisarad.sisarad.entities.Productos;

public class DashboardResumen {

	private long unidadesMovidasSemana;
	private long vendedoresActivosSemana;
	private long clientesAtendidosSemana;
	private long despachosProcesadosSemana;
	private String liderVentasSemana;
	private String productoMasDespachadoSemana;
	private List<Productos> productosProximosVencer = new ArrayList<>();

	public long getUnidadesMovidasSemana() {
		return unidadesMovidasSemana;
	}

	public void setUnidadesMovidasSemana(long unidadesMovidasSemana) {
		this.unidadesMovidasSemana = unidadesMovidasSemana;
	}

	public long getVendedoresActivosSemana() {
		return vendedoresActivosSemana;
	}

	public void setVendedoresActivosSemana(long vendedoresActivosSemana) {
		this.vendedoresActivosSemana = vendedoresActivosSemana;
	}

	public long getClientesAtendidosSemana() {
		return clientesAtendidosSemana;
	}

	public void setClientesAtendidosSemana(long clientesAtendidosSemana) {
		this.clientesAtendidosSemana = clientesAtendidosSemana;
	}

	public long getDespachosProcesadosSemana() {
		return despachosProcesadosSemana;
	}

	public void setDespachosProcesadosSemana(long despachosProcesadosSemana) {
		this.despachosProcesadosSemana = despachosProcesadosSemana;
	}

	public String getLiderVentasSemana() {
		return liderVentasSemana;
	}

	public void setLiderVentasSemana(String liderVentasSemana) {
		this.liderVentasSemana = liderVentasSemana;
	}

	public String getProductoMasDespachadoSemana() {
		return productoMasDespachadoSemana;
	}

	public void setProductoMasDespachadoSemana(String productoMasDespachadoSemana) {
		this.productoMasDespachadoSemana = productoMasDespachadoSemana;
	}

	public List<Productos> getProductosProximosVencer() {
		return productosProximosVencer;
	}

	public void setProductosProximosVencer(List<Productos> productosProximosVencer) {
		this.productosProximosVencer = productosProximosVencer;
	}
}
