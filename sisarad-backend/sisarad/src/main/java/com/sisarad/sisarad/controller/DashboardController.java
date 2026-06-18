package com.sisarad.sisarad.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sisarad.sisarad.model.DashboardResumen;
import com.sisarad.sisarad.services.DashboardService;

@CrossOrigin("*")
@RestController
@RequestMapping("/dashboard")
public class DashboardController {

	@Autowired
	private DashboardService dashboardService;

	@GetMapping("/resumenSemanal")
	public ResponseEntity<DashboardResumen> resumenSemanal() {
		return ResponseEntity.ok(dashboardService.obtenerResumenSemanal());
	}
}
