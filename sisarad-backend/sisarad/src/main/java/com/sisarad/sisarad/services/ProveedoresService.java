package com.sisarad.sisarad.services;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.sisarad.sisarad.entities.Proveedores;
import com.sisarad.sisarad.repository.ProveedoresRepository;

@Service
public class ProveedoresService {

	@Autowired
	private ProveedoresRepository proveedoresRepository;

	public Proveedores save(Proveedores proveedor) {
		if (proveedor.getEstado() == null || proveedor.getEstado().isBlank()) {
			proveedor.setEstado("ACTIVO");
		}
		return proveedoresRepository.save(proveedor);
	}

	public List<Proveedores> findAll() {
		return proveedoresRepository.findAll();
	}

	public Proveedores findById(Long id) {
		return proveedoresRepository.findById(id).orElse(null);
	}

	public Proveedores update(Long id, Proveedores proveedorEntrante) {
		Optional<Proveedores> optional = proveedoresRepository.findById(id);
		if (!optional.isPresent()) {
			throw new IllegalArgumentException("Proveedor no encontrado con ID: " + id);
		}
		Proveedores existente = optional.get();
		if (proveedorEntrante.getNombre() != null && !proveedorEntrante.getNombre().trim().isEmpty()) {
			existente.setNombre(proveedorEntrante.getNombre());
		}
		if (proveedorEntrante.getTelefono() != null && !proveedorEntrante.getTelefono().trim().isEmpty()) {
			existente.setTelefono(proveedorEntrante.getTelefono());
		}
		if (proveedorEntrante.getEmpresa() != null && !proveedorEntrante.getEmpresa().trim().isEmpty()) {
			existente.setEmpresa(proveedorEntrante.getEmpresa());
		}
		if (proveedorEntrante.getEstado() != null && !proveedorEntrante.getEstado().trim().isEmpty()) {
			existente.setEstado(proveedorEntrante.getEstado());
		}
		return proveedoresRepository.save(existente);
	}

	public Proveedores alternarEstado(Long id) {
		Proveedores proveedor = findById(id);
		if (proveedor == null) {
			throw new IllegalArgumentException("Proveedor no encontrado con ID: " + id);
		}
		proveedor.setEstado("ACTIVO".equals(proveedor.getEstado()) ? "INACTIVO" : "ACTIVO");
		return proveedoresRepository.save(proveedor);
	}

	public void deleteById(Long id) {
		proveedoresRepository.deleteById(id);
	}
}
