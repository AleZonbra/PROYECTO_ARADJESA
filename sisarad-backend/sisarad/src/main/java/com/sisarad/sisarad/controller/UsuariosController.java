package com.sisarad.sisarad.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.sisarad.sisarad.entities.Usuarios;
import com.sisarad.sisarad.services.UsuariosService;

@CrossOrigin("*")
@RestController
@RequestMapping("/usuarios")
public class UsuariosController {

	@Autowired
	private UsuariosService usuariosService;

	@PostMapping("/create")
	public ResponseEntity<String> create(@RequestBody Usuarios usuario) {
		Usuarios insertUsuario = usuariosService.save(usuario);
		return ResponseEntity.status(HttpStatus.OK).contentType(MediaType.APPLICATION_JSON)
				.body("Usuario creado con ID: " + insertUsuario.getId());
	}

	@GetMapping("/search")
	public ResponseEntity<Usuarios> search(@RequestParam String usuario) {
		Usuarios found = usuariosService.findByUsuario(usuario);
		if (found == null) {
			return ResponseEntity.notFound().build();
		}
		return ResponseEntity.ok(found);
	}

	@GetMapping("/getAll")
	public ResponseEntity<List<Usuarios>> getAll() {
		return ResponseEntity.ok(usuariosService.findAll());
	}

	@PutMapping("/update/{id}")
	public ResponseEntity<String> update(@PathVariable String id, @RequestBody Usuarios usuarioEntrante) {
		try {
			Usuarios actualizado = usuariosService.update(id, usuarioEntrante);
			return ResponseEntity.ok("Usuario con ID: " + actualizado.getId() + " actualizado exitosamente.");
		} catch (IllegalArgumentException e) {
			return ResponseEntity.badRequest().body(e.getMessage());
		}
	}

	@DeleteMapping("/delete/{id}")
	public ResponseEntity<String> delete(@PathVariable String id) {
		usuariosService.deleteById(id);
		return ResponseEntity.ok("Usuario con ID: " + id + " eliminado.");
	}
}
