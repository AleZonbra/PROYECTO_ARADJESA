package com.sisarad.sisarad.services;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.sisarad.sisarad.entities.Productos;
import com.sisarad.sisarad.repository.ProductosRepository;

@Service
public class ProductosService {

	@Autowired
	private ProductosRepository productosRepository;

	public Productos save(Productos producto) {
		return productosRepository.save(producto);
	}

	public List<Productos> findAll() {
		return productosRepository.findAll();
	}

	public Productos findById(Long id) {
		return productosRepository.findById(id).orElse(null);
	}

	public List<Productos> findByProductoContaining(String producto) {
		return productosRepository.findByProductoContainingIgnoreCase(producto);
	}

	public Productos update(Long id, Productos productoEntrante) {
		Optional<Productos> optional = productosRepository.findById(id);
		if (!optional.isPresent()) {
			throw new IllegalArgumentException("Producto no encontrado con ID: " + id);
		}
		Productos existente = optional.get();
		if (productoEntrante.getProducto() != null && !productoEntrante.getProducto().trim().isEmpty()) {
			existente.setProducto(productoEntrante.getProducto());
		}
		if (productoEntrante.getSerialLote() != null && !productoEntrante.getSerialLote().trim().isEmpty()) {
			existente.setSerialLote(productoEntrante.getSerialLote());
		}
		if (productoEntrante.getCantidad() != null) {
			existente.setCantidad(productoEntrante.getCantidad());
		}
		if (productoEntrante.getFechaProduccion() != null) {
			existente.setFechaProduccion(productoEntrante.getFechaProduccion());
		}
		if (productoEntrante.getFechaExpiracion() != null) {
			existente.setFechaExpiracion(productoEntrante.getFechaExpiracion());
		}
		return productosRepository.save(existente);
	}

	public void deleteById(Long id) {
		productosRepository.deleteById(id);
	}

	public List<Productos> findProximosVencer(int limit) {
		return productosRepository.findAll().stream()
				.filter(p -> p.getFechaExpiracion() != null && !p.getFechaExpiracion().isBlank())
				.sorted(Comparator.comparing(Productos::getFechaExpiracion))
				.limit(limit)
				.collect(Collectors.toList());
	}
}
