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

import com.sisarad.sisarad.entities.Vendedores;
import com.sisarad.sisarad.services.VendedoresService;

@CrossOrigin("*")
@RestController
@RequestMapping("/vendedores")
public class VendedoresController {

	@Autowired
	private VendedoresService vendedoresService;

	@PostMapping("/create")
	public ResponseEntity<String> create(@RequestBody Vendedores vendedor) {
		Vendedores insertado = vendedoresService.save(vendedor);
		return ResponseEntity.ok("Vendedor creado con ID: " + insertado.getId());
	}

	@GetMapping("/getAll")
	public ResponseEntity<List<Vendedores>> getAll() {
		return ResponseEntity.ok(vendedoresService.findAll());
	}

	@GetMapping("/getById")
	public ResponseEntity<Vendedores> getById(@RequestParam Long id) {
		Vendedores found = vendedoresService.findById(id);
		return found != null ? ResponseEntity.ok(found) : ResponseEntity.notFound().build();
	}

	@PutMapping("/update/{id}")
	public ResponseEntity<Vendedores> update(@PathVariable Long id, @RequestBody Vendedores vendedorEntrante) {
		try {
			return ResponseEntity.ok(vendedoresService.update(id, vendedorEntrante));
		} catch (IllegalArgumentException e) {
			return ResponseEntity.notFound().build();
		}
	}

	@PutMapping("/alternarEstado/{id}")
	public ResponseEntity<Vendedores> alternarEstado(@PathVariable Long id) {
		try {
			return ResponseEntity.ok(vendedoresService.alternarEstado(id));
		} catch (IllegalArgumentException e) {
			return ResponseEntity.notFound().build();
		}
	}

	@DeleteMapping("/delete/{id}")
	public ResponseEntity<String> delete(@PathVariable Long id) {
		vendedoresService.deleteById(id);
		return ResponseEntity.ok("Vendedor con ID: " + id + " eliminado.");
	}
}
