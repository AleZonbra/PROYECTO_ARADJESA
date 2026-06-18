package com.sisarad.sisarad.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sisarad.sisarad.entities.Productos;

public interface ProductosRepository extends JpaRepository<Productos, Long> {
	List<Productos> findByProductoContainingIgnoreCase(String producto);
}
