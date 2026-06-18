package com.sisarad.sisarad.services;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.sisarad.sisarad.entities.Usuarios;
import com.sisarad.sisarad.repository.UsuariosRepository;

@Service
public class UsuariosService {

	@Autowired
	private UsuariosRepository usuariosRepository;

	public Usuarios save(Usuarios usuario) {
		return usuariosRepository.save(usuario);
	}

	public List<Usuarios> findAll() {
		return usuariosRepository.findAll();
	}

	public Usuarios findByUsuario(String usuario) {
		return usuariosRepository.findByUsuario(usuario).orElse(null);
	}

	public Usuarios update(String id, Usuarios usuarioEntrante) {
		Optional<Usuarios> optional = usuariosRepository.findById(id);
		if (!optional.isPresent()) {
			throw new IllegalArgumentException("Usuario no encontrado con ID: " + id);
		}
		Usuarios existente = optional.get();
		if (usuarioEntrante.getNombre() != null && !usuarioEntrante.getNombre().trim().isEmpty()) {
			existente.setNombre(usuarioEntrante.getNombre());
		}
		if (usuarioEntrante.getClave() != null && !usuarioEntrante.getClave().trim().isEmpty()) {
			existente.setClave(usuarioEntrante.getClave());
		}
		if (usuarioEntrante.getRole() != null && !usuarioEntrante.getRole().trim().isEmpty()) {
			existente.setRole(usuarioEntrante.getRole());
		}
		if (usuarioEntrante.getActivo() != null) {
			existente.setActivo(usuarioEntrante.getActivo());
		}
		return usuariosRepository.save(existente);
	}

	public void deleteById(String id) {
		usuariosRepository.deleteById(id);
	}
}
