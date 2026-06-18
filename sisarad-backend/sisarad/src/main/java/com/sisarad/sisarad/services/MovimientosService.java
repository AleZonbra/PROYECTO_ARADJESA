package com.sisarad.sisarad.services;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.WeekFields;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sisarad.sisarad.entities.Movimientos;
import com.sisarad.sisarad.entities.Productos;
import com.sisarad.sisarad.exceptions.StockInsuficienteException;
import com.sisarad.sisarad.repository.MovimientosRepository;

@Service
public class MovimientosService {

	@Autowired
	private MovimientosRepository movimientosRepository;

	@Autowired
	private ProductosService productosService;

	@Autowired
	private VendedoresService vendedoresService;

	@Autowired
	private ClientesService clientesService;

	public List<Movimientos> findAll() {
		return movimientosRepository.findAll();
	}

	public Movimientos findById(Long id) {
		return movimientosRepository.findById(id).orElse(null);
	}

	@Transactional
	public Movimientos save(Movimientos movimiento) {
		if (movimiento.getProducto() == null || movimiento.getProducto().getId() == null) {
			throw new IllegalArgumentException("Producto requerido");
		}
		if (movimiento.getVendedor() == null || movimiento.getVendedor().getId() == null) {
			throw new IllegalArgumentException("Vendedor requerido");
		}
		if (movimiento.getCliente() == null || movimiento.getCliente().getId() == null) {
			throw new IllegalArgumentException("Cliente requerido");
		}
		if (movimiento.getCantidad() == null || movimiento.getCantidad() <= 0) {
			throw new IllegalArgumentException("Cantidad inválida");
		}

		Productos producto = productosService.findById(movimiento.getProducto().getId());
		if (producto == null) {
			throw new IllegalArgumentException("Producto no encontrado");
		}
		if (producto.getCantidad() == null || producto.getCantidad() < movimiento.getCantidad()) {
			throw new StockInsuficienteException("Inventario insuficiente para el producto seleccionado");
		}

		movimiento.setProducto(producto);
		movimiento.setVendedor(vendedoresService.findById(movimiento.getVendedor().getId()));
		movimiento.setCliente(clientesService.findById(movimiento.getCliente().getId()));
		movimiento.setFechaSalida(LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
		if (movimiento.getEstadoDespacho() == null || movimiento.getEstadoDespacho().isBlank()) {
			movimiento.setEstadoDespacho("POR ENTREGAR");
		}

		producto.setCantidad(producto.getCantidad() - movimiento.getCantidad());
		productosService.save(producto);

		return movimientosRepository.save(movimiento);
	}

	@Transactional
	public Movimientos update(Long id, Movimientos movimientoEntrante) {
		Optional<Movimientos> optional = movimientosRepository.findById(id);
		if (!optional.isPresent()) {
			throw new IllegalArgumentException("Despacho no encontrado con ID: " + id);
		}

		Movimientos existente = optional.get();
		Productos productoAnterior = existente.getProducto();
		int cantidadAnterior = existente.getCantidad();

		productoAnterior.setCantidad(productoAnterior.getCantidad() + cantidadAnterior);
		productosService.save(productoAnterior);

		Long productoId = movimientoEntrante.getProducto() != null && movimientoEntrante.getProducto().getId() != null
				? movimientoEntrante.getProducto().getId()
				: productoAnterior.getId();
		Long vendedorId = movimientoEntrante.getVendedor() != null && movimientoEntrante.getVendedor().getId() != null
				? movimientoEntrante.getVendedor().getId()
				: existente.getVendedor().getId();
		Long clienteId = movimientoEntrante.getCliente() != null && movimientoEntrante.getCliente().getId() != null
				? movimientoEntrante.getCliente().getId()
				: existente.getCliente().getId();
		int nuevaCantidad = movimientoEntrante.getCantidad() != null ? movimientoEntrante.getCantidad() : cantidadAnterior;

		Productos productoNuevo = productosService.findById(productoId);
		if (productoNuevo == null) {
			throw new IllegalArgumentException("Producto no encontrado");
		}
		if (productoNuevo.getCantidad() < nuevaCantidad) {
			throw new StockInsuficienteException("Inventario insuficiente para actualizar el despacho");
		}

		productoNuevo.setCantidad(productoNuevo.getCantidad() - nuevaCantidad);
		productosService.save(productoNuevo);

		existente.setProducto(productoNuevo);
		existente.setVendedor(vendedoresService.findById(vendedorId));
		existente.setCliente(clientesService.findById(clienteId));
		existente.setCantidad(nuevaCantidad);
		if (movimientoEntrante.getEstadoDespacho() != null && !movimientoEntrante.getEstadoDespacho().isBlank()) {
			existente.setEstadoDespacho(movimientoEntrante.getEstadoDespacho());
		}

		return movimientosRepository.save(existente);
	}

	@Transactional
	public void deleteById(Long id) {
		Movimientos movimiento = findById(id);
		if (movimiento == null) {
			throw new IllegalArgumentException("Despacho no encontrado con ID: " + id);
		}
		Productos producto = movimiento.getProducto();
		producto.setCantidad(producto.getCantidad() + movimiento.getCantidad());
		productosService.save(producto);
		movimientosRepository.deleteById(id);
	}

	public List<Movimientos> findSemanaActual() {
		WeekFields weekFields = WeekFields.of(Locale.getDefault());
		int semanaActual = LocalDate.now().get(weekFields.weekOfWeekBasedYear());
		int anioActual = LocalDate.now().get(weekFields.weekBasedYear());

		return movimientosRepository.findAll().stream()
				.filter(m -> esMismaSemana(m.getFechaSalida(), semanaActual, anioActual))
				.collect(Collectors.toList());
	}

	private boolean esMismaSemana(String fechaSalida, int semana, int anio) {
		if (fechaSalida == null || fechaSalida.isBlank()) {
			return false;
		}
		try {
			LocalDate fecha = LocalDate.parse(fechaSalida, DateTimeFormatter.ofPattern("dd/MM/yyyy"));
			WeekFields weekFields = WeekFields.of(Locale.getDefault());
			return fecha.get(weekFields.weekOfWeekBasedYear()) == semana
					&& fecha.get(weekFields.weekBasedYear()) == anio;
		} catch (Exception e) {
			return false;
		}
	}

	public String obtenerLiderVentasSemana(List<Movimientos> movimientosSemana) {
		return movimientosSemana.stream()
				.filter(m -> m.getVendedor() != null)
				.collect(Collectors.groupingBy(m -> m.getVendedor().getNombre(),
						Collectors.summingInt(Movimientos::getCantidad)))
				.entrySet().stream()
				.max(Map.Entry.comparingByValue())
				.map(Map.Entry::getKey)
				.orElse("NINGUNO");
	}

	public String obtenerProductoTopSemana(List<Movimientos> movimientosSemana) {
		return movimientosSemana.stream()
				.filter(m -> m.getProducto() != null)
				.collect(Collectors.groupingBy(m -> m.getProducto().getProducto(),
						Collectors.summingInt(Movimientos::getCantidad)))
				.entrySet().stream()
				.max(Map.Entry.comparingByValue())
				.map(Map.Entry::getKey)
				.orElse("NINGUNO");
	}

	public Movimientos findUltimo() {
		return movimientosRepository.findAll().stream()
				.max(Comparator.comparing(Movimientos::getId))
				.orElse(null);
	}
}
