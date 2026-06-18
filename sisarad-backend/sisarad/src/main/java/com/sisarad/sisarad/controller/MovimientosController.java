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

import com.sisarad.sisarad.entities.Movimientos;
import com.sisarad.sisarad.services.MovimientosService;

@CrossOrigin("*")
@RestController
@RequestMapping("/movimientos")
public class MovimientosController {

	@Autowired
	private MovimientosService movimientosService;

	@PostMapping("/create")
	public ResponseEntity<Movimientos> create(@RequestBody Movimientos movimiento) {
		return ResponseEntity.ok(movimientosService.save(movimiento));
	}

	@GetMapping("/getAll")
	public ResponseEntity<List<Movimientos>> getAll() {
		return ResponseEntity.ok(movimientosService.findAll());
	}

	@GetMapping("/getById")
	public ResponseEntity<Movimientos> getById(@RequestParam Long id) {
		Movimientos found = movimientosService.findById(id);
		return found != null ? ResponseEntity.ok(found) : ResponseEntity.notFound().build();
	}

	@GetMapping("/ultimo")
	public ResponseEntity<Movimientos> ultimo() {
		Movimientos found = movimientosService.findUltimo();
		return found != null ? ResponseEntity.ok(found) : ResponseEntity.notFound().build();
	}

	@PutMapping("/update/{id}")
	public ResponseEntity<Movimientos> update(@PathVariable Long id, @RequestBody Movimientos movimientoEntrante) {
		try {
			return ResponseEntity.ok(movimientosService.update(id, movimientoEntrante));
		} catch (IllegalArgumentException e) {
			return ResponseEntity.badRequest().build();
		}
	}

	@DeleteMapping("/delete/{id}")
	public ResponseEntity<String> delete(@PathVariable Long id) {
		movimientosService.deleteById(id);
		return ResponseEntity.ok("Despacho con ID: " + id + " eliminado.");
	}
}
