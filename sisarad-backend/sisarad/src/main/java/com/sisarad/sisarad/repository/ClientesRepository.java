package com.sisarad.sisarad.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sisarad.sisarad.entities.Clientes;

public interface ClientesRepository extends JpaRepository<Clientes, Long> {
}
