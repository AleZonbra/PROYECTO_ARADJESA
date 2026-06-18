package com.sisarad.sisarad.services;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.sisarad.sisarad.entities.Movimientos;
import com.sisarad.sisarad.model.DashboardResumen;

@Service
public class DashboardService {

	@Autowired
	private MovimientosService movimientosService;

	@Autowired
	private ProductosService productosService;

	public DashboardResumen obtenerResumenSemanal() {
		List<Movimientos> semana = movimientosService.findSemanaActual();
		DashboardResumen resumen = new DashboardResumen();
		resumen.setUnidadesMovidasSemana(semana.stream().mapToLong(Movimientos::getCantidad).sum());
		resumen.setVendedoresActivosSemana(
				semana.stream().filter(m -> m.getVendedor() != null).map(m -> m.getVendedor().getId()).distinct()
						.count());
		resumen.setClientesAtendidosSemana(
				semana.stream().filter(m -> m.getCliente() != null).map(m -> m.getCliente().getId()).distinct()
						.count());
		resumen.setDespachosProcesadosSemana(semana.size());
		resumen.setLiderVentasSemana(movimientosService.obtenerLiderVentasSemana(semana));
		resumen.setProductoMasDespachadoSemana(movimientosService.obtenerProductoTopSemana(semana));
		resumen.setProductosProximosVencer(productosService.findProximosVencer(4));
		return resumen;
	}
}
