package com.sisarad.sisarad.services;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.sisarad.sisarad.entities.Clientes;
import com.sisarad.sisarad.repository.ClientesRepository;

@Service
public class ClientesService {

	@Autowired
	private ClientesRepository clientesRepository;

	public Clientes save(Clientes cliente) {
		return clientesRepository.save(cliente);
	}

	public List<Clientes> findAll() {
		return clientesRepository.findAll();
	}

	public Clientes findById(Long id) {
		return clientesRepository.findById(id).orElse(null);
	}

	public Clientes update(Long id, Clientes clienteEntrante) {
		Optional<Clientes> optional = clientesRepository.findById(id);
		if (!optional.isPresent()) {
			throw new IllegalArgumentException("Cliente no encontrado con ID: " + id);
		}
		Clientes existente = optional.get();
		if (clienteEntrante.getNombre() != null && !clienteEntrante.getNombre().trim().isEmpty()) {
			existente.setNombre(clienteEntrante.getNombre());
		}
		if (clienteEntrante.getTelefono() != null && !clienteEntrante.getTelefono().trim().isEmpty()) {
			existente.setTelefono(clienteEntrante.getTelefono());
		}
		if (clienteEntrante.getCorreo() != null && !clienteEntrante.getCorreo().trim().isEmpty()) {
			existente.setCorreo(clienteEntrante.getCorreo());
		}
		if (clienteEntrante.getDireccion() != null) {
			existente.setDireccion(clienteEntrante.getDireccion());
		}
		return clientesRepository.save(existente);
	}

	public void deleteById(Long id) {
		clientesRepository.deleteById(id);
	}
}
