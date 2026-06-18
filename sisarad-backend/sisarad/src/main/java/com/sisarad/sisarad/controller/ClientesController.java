package com.sisarad.sisarad.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
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

import com.sisarad.sisarad.entities.Clientes;
import com.sisarad.sisarad.services.ClientesService;

@CrossOrigin("*")
@RestController
@RequestMapping("/clientes")
public class ClientesController {

	@Autowired
	private ClientesService clientesService;

	@PostMapping("/create")
	public ResponseEntity<String> create(@RequestBody Clientes cliente) {
		Clientes insertado = clientesService.save(cliente);
		return ResponseEntity.ok("Cliente creado con ID: " + insertado.getId());
	}

	@GetMapping("/getAll")
	public ResponseEntity<List<Clientes>> getAll() {
		return ResponseEntity.ok(clientesService.findAll());
	}

	@GetMapping("/getById")
	public ResponseEntity<Clientes> getById(@RequestParam Long id) {
		Clientes found = clientesService.findById(id);
		return found != null ? ResponseEntity.ok(found) : ResponseEntity.notFound().build();
	}

	@PutMapping("/update/{id}")
	public ResponseEntity<Clientes> update(@PathVariable Long id, @RequestBody Clientes clienteEntrante) {
		try {
			return ResponseEntity.ok(clientesService.update(id, clienteEntrante));
		} catch (IllegalArgumentException e) {
			return ResponseEntity.notFound().build();
		}
	}

	@DeleteMapping("/delete/{id}")
	public ResponseEntity<String> delete(@PathVariable Long id) {
		clientesService.deleteById(id);
		return ResponseEntity.ok("Cliente con ID: " + id + " eliminado.");
	}
}
