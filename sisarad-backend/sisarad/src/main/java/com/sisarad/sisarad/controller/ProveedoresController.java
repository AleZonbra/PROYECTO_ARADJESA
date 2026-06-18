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

import com.sisarad.sisarad.entities.Proveedores;
import com.sisarad.sisarad.services.ProveedoresService;

@CrossOrigin("*")
@RestController
@RequestMapping("/proveedores")
public class ProveedoresController {

	@Autowired
	private ProveedoresService proveedoresService;

	@PostMapping("/create")
	public ResponseEntity<String> create(@RequestBody Proveedores proveedor) {
		Proveedores insertado = proveedoresService.save(proveedor);
		return ResponseEntity.ok("Proveedor creado con ID: " + insertado.getId());
	}

	@GetMapping("/getAll")
	public ResponseEntity<List<Proveedores>> getAll() {
		return ResponseEntity.ok(proveedoresService.findAll());
	}

	@GetMapping("/getById")
	public ResponseEntity<Proveedores> getById(@RequestParam Long id) {
		Proveedores found = proveedoresService.findById(id);
		return found != null ? ResponseEntity.ok(found) : ResponseEntity.notFound().build();
	}

	@PutMapping("/update/{id}")
	public ResponseEntity<Proveedores> update(@PathVariable Long id, @RequestBody Proveedores proveedorEntrante) {
		try {
			return ResponseEntity.ok(proveedoresService.update(id, proveedorEntrante));
		} catch (IllegalArgumentException e) {
			return ResponseEntity.notFound().build();
		}
	}

	@PutMapping("/alternarEstado/{id}")
	public ResponseEntity<Proveedores> alternarEstado(@PathVariable Long id) {
		try {
			return ResponseEntity.ok(proveedoresService.alternarEstado(id));
		} catch (IllegalArgumentException e) {
			return ResponseEntity.notFound().build();
		}
	}

	@DeleteMapping("/delete/{id}")
	public ResponseEntity<String> delete(@PathVariable Long id) {
		proveedoresService.deleteById(id);
		return ResponseEntity.ok("Proveedor con ID: " + id + " eliminado.");
	}
}
