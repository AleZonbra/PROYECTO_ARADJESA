package com.sisarad.sisarad.services;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.sisarad.sisarad.entities.Vendedores;
import com.sisarad.sisarad.repository.VendedoresRepository;

@Service
public class VendedoresService {

	@Autowired
	private VendedoresRepository vendedoresRepository;

	public Vendedores save(Vendedores vendedor) {
		if (vendedor.getEstado() == null || vendedor.getEstado().isBlank()) {
			vendedor.setEstado("ACTIVO");
		}
		return vendedoresRepository.save(vendedor);
	}

	public List<Vendedores> findAll() {
		return vendedoresRepository.findAll();
	}

	public Vendedores findById(Long id) {
		return vendedoresRepository.findById(id).orElse(null);
	}

	public Vendedores update(Long id, Vendedores vendedorEntrante) {
		Optional<Vendedores> optional = vendedoresRepository.findById(id);
		if (!optional.isPresent()) {
			throw new IllegalArgumentException("Vendedor no encontrado con ID: " + id);
		}
		Vendedores existente = optional.get();
		if (vendedorEntrante.getNombre() != null && !vendedorEntrante.getNombre().trim().isEmpty()) {
			existente.setNombre(vendedorEntrante.getNombre());
		}
		if (vendedorEntrante.getNumEmpleado() != null && !vendedorEntrante.getNumEmpleado().trim().isEmpty()) {
			existente.setNumEmpleado(vendedorEntrante.getNumEmpleado());
		}
		if (vendedorEntrante.getTrabajosRealizados() != null) {
			existente.setTrabajosRealizados(vendedorEntrante.getTrabajosRealizados());
		}
		if (vendedorEntrante.getEstado() != null && !vendedorEntrante.getEstado().trim().isEmpty()) {
			existente.setEstado(vendedorEntrante.getEstado());
		}
		return vendedoresRepository.save(existente);
	}

	public Vendedores alternarEstado(Long id) {
		Vendedores vendedor = findById(id);
		if (vendedor == null) {
			throw new IllegalArgumentException("Vendedor no encontrado con ID: " + id);
		}
		vendedor.setEstado("ACTIVO".equals(vendedor.getEstado()) ? "INACTIVO" : "ACTIVO");
		return vendedoresRepository.save(vendedor);
	}

	public void deleteById(Long id) {
		vendedoresRepository.deleteById(id);
	}
}
