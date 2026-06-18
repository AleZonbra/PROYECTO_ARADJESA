package com.sisarad.sisarad.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sisarad.sisarad.entities.Usuarios;

public interface UsuariosRepository extends JpaRepository<Usuarios, String> {
	Optional<Usuarios> findByUsuario(String usuario);
}
