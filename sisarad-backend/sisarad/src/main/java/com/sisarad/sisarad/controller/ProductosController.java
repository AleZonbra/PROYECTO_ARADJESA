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

import com.sisarad.sisarad.entities.Productos;
import com.sisarad.sisarad.services.ProductosService;

@CrossOrigin("*")
@RestController
@RequestMapping("/productos")
public class ProductosController {

	@Autowired
	private ProductosService productosService;

	@PostMapping("/create")
	public ResponseEntity<String> create(@RequestBody Productos producto) {
		Productos insertado = productosService.save(producto);
		return ResponseEntity.status(HttpStatus.OK).contentType(MediaType.APPLICATION_JSON)
				.body("Producto creado con ID: " + insertado.getId());
	}

	@GetMapping("/getAll")
	public ResponseEntity<List<Productos>> getAll() {
		return ResponseEntity.ok(productosService.findAll());
	}

	@GetMapping("/getById")
	public ResponseEntity<Productos> getById(@RequestParam Long id) {
		Productos found = productosService.findById(id);
		return found != null ? ResponseEntity.ok(found) : ResponseEntity.notFound().build();
	}

	@PutMapping("/update/{id}")
	public ResponseEntity<Productos> update(@PathVariable Long id, @RequestBody Productos productoEntrante) {
		try {
			return ResponseEntity.ok(productosService.update(id, productoEntrante));
		} catch (IllegalArgumentException e) {
			return ResponseEntity.notFound().build();
		}
	}

	@GetMapping("/getByNombre")
	public ResponseEntity<List<Productos>> getByNombre(@RequestParam String nombre) {
		List<Productos> found = productosService.findByProductoContaining(nombre);
		return found.isEmpty() ? ResponseEntity.notFound().build() : ResponseEntity.ok(found);
	}

	@DeleteMapping("/delete/{id}")
	public ResponseEntity<String> delete(@PathVariable Long id) {
		productosService.deleteById(id);
		return ResponseEntity.ok("Producto con ID: " + id + " eliminado.");
	}
}
