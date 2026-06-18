package com.sisarad.sisarad.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.sisarad.sisarad.entities.Clientes;
import com.sisarad.sisarad.entities.Movimientos;
import com.sisarad.sisarad.entities.Productos;
import com.sisarad.sisarad.entities.Proveedores;
import com.sisarad.sisarad.entities.Usuarios;
import com.sisarad.sisarad.entities.Vendedores;
import com.sisarad.sisarad.repository.ClientesRepository;
import com.sisarad.sisarad.repository.MovimientosRepository;
import com.sisarad.sisarad.repository.ProductosRepository;
import com.sisarad.sisarad.repository.ProveedoresRepository;
import com.sisarad.sisarad.repository.UsuariosRepository;
import com.sisarad.sisarad.repository.VendedoresRepository;
import com.sisarad.sisarad.services.MovimientosService;

import jakarta.annotation.PostConstruct;

@Component
public class DataInitializer {

	@Autowired
	private UsuariosRepository usuariosRepository;
	@Autowired
	private ProductosRepository productosRepository;
	@Autowired
	private VendedoresRepository vendedoresRepository;
	@Autowired
	private ProveedoresRepository proveedoresRepository;
	@Autowired
	private ClientesRepository clientesRepository;
	@Autowired
	private MovimientosRepository movimientosRepository;
	@Autowired
	private MovimientosService movimientosService;

	@PostConstruct
	public void inicializarDatos() {
		seedAdmin();
		if (productosRepository.count() == 0) {
			seedProductos();
		}
		if (vendedoresRepository.count() == 0) {
			seedVendedores();
		}
		if (proveedoresRepository.count() == 0) {
			seedProveedores();
		}
		if (clientesRepository.count() == 0) {
			seedClientes();
		}
		if (movimientosRepository.count() == 0 && productosRepository.count() > 0) {
			seedMovimientos();
		}
	}

	private void seedAdmin() {
		if (!usuariosRepository.existsById("admin")) {
			Usuarios admin = new Usuarios();
			admin.setId("admin");
			admin.setUsuario("admin");
			admin.setNombre("Administrador");
			admin.setClave("admin");
			admin.setRole("administrador");
			admin.setActivo(true);
			usuariosRepository.save(admin);
		}
	}

	private void seedProductos() {
		String[][] datos = {
				{ "ARROZ PREMIUM 1KG", "LOT-2026-001", "120", "01/01/2026", "01/01/2027" },
				{ "ACEITE VEGETAL 900ML", "LOT-2026-002", "85", "05/01/2026", "05/07/2026" },
				{ "HARINA PAN 1KG", "LOT-2026-003", "200", "10/01/2026", "10/10/2026" },
				{ "AZÚCAR BLANCA 1KG", "LOT-2026-004", "150", "12/01/2026", "12/12/2026" },
				{ "PASTA SPAGHETTI 500G", "LOT-2026-005", "95", "15/01/2026", "15/08/2026" },
				{ "ATÚN EN LATA 140G", "LOT-2026-006", "60", "18/01/2026", "18/06/2027" },
				{ "LECHE EN POLVO 400G", "LOT-2026-007", "75", "20/01/2026", "20/01/2027" },
				{ "CAFÉ MOLIDO 250G", "LOT-2026-008", "40", "22/01/2026", "22/04/2026" },
				{ "SAL REFINADA 1KG", "LOT-2026-009", "180", "25/01/2026", "25/12/2027" },
				{ "SARDINAS EN LATA 170G", "LOT-2026-010", "55", "28/01/2026", "28/09/2026" },
				{ "MAÍZ PAN 1KG", "LOT-2026-011", "110", "02/02/2026", "02/02/2027" },
				{ "GALLETAS MARÍA 200G", "LOT-2026-012", "90", "05/02/2026", "05/08/2026" },
				{ "JABÓN DE TOCADOR", "LOT-2026-013", "130", "08/02/2026", "08/02/2028" },
				{ "DETERGENTE 1KG", "LOT-2026-014", "70", "10/02/2026", "10/10/2027" },
				{ "PAPEL HIGIÉNICO 4U", "LOT-2026-015", "45", "12/02/2026", "12/12/2028" },
		};
		for (String[] d : datos) {
			Productos p = new Productos();
			p.setProducto(d[0]);
			p.setSerialLote(d[1]);
			p.setCantidad(Integer.parseInt(d[2]));
			p.setFechaProduccion(d[3]);
			p.setFechaExpiracion(d[4]);
			productosRepository.save(p);
		}
	}

	private void seedVendedores() {
		String[][] datos = {
				{ "CARLOS MENDOZA", "EMP-001", "DESPACHOS ZONA NORTE" },
				{ "MARÍA GONZÁLEZ", "EMP-002", "VENTAS MAYORISTAS" },
				{ "JOSÉ RODRÍGUEZ", "EMP-003", "RUTA CENTRO" },
				{ "ANA PÉREZ", "EMP-004", "DESPACHOS EXPRESS" },
				{ "LUIS HERRERA", "EMP-005", "ZONA SUR" },
				{ "PATRICIA SILVA", "EMP-006", "CLIENTES CORPORATIVOS" },
				{ "RICARDO TORRES", "EMP-007", "RUTA ESTE" },
				{ "ELENA MARTÍNEZ", "EMP-008", "DESPACHOS NOCTURNOS" },
				{ "FERNANDO DÍAZ", "EMP-009", "VENTAS DETAL" },
				{ "SOFÍA RAMÍREZ", "EMP-010", "ZONA OESTE" },
				{ "DIEGO CASTRO", "EMP-011", "LOGÍSTICA INTERNA" },
				{ "VALENTINA LOPEZ", "EMP-012", "DESPACHOS ESPECIALES" },
		};
		for (String[] d : datos) {
			Vendedores v = new Vendedores();
			v.setNombre(d[0]);
			v.setNumEmpleado(d[1]);
			v.setTrabajosRealizados(d[2]);
			v.setEstado("ACTIVO");
			vendedoresRepository.save(v);
		}
	}

	private void seedProveedores() {
		String[][] datos = {
				{ "DISTRIBUIDORA ALIMENTOS C.A.", "0212-5550101", "ALIMENTOS DEL VALLE" },
				{ "COMERCIAL LA GRANJA", "0212-5550102", "LA GRANJA" },
				{ "IMPORTADORA NACIONAL", "0212-5550103", "IMPORTNAC" },
				{ "PROVEEDORA DEL CENTRO", "0212-5550104", "PROCEN" },
				{ "SUMINISTROS INDUSTRIALES", "0212-5550105", "SUMIND" },
				{ "ALMACÉN EL PROGRESO", "0212-5550106", "EL PROGRESO" },
				{ "DISTRIBUCIONES MIRANDA", "0212-5550107", "MIRANDA DIST" },
				{ "COMERCIALIZADORA UNIDA", "0212-5550108", "COMUNIDA" },
				{ "GRUPO SUMINISTRO TOTAL", "0212-5550109", "GST" },
				{ "LOGÍSTICA Y ABASTO", "0212-5550110", "LOGABASTO" },
				{ "PROVEEDORA METRÓNICA", "0212-5550111", "METRONICA" },
				{ "DISTRIBUIDORA ARADJESA", "0212-5550112", "ARADJESA" },
		};
		for (String[] d : datos) {
			Proveedores p = new Proveedores();
			p.setNombre(d[0]);
			p.setTelefono(d[1]);
			p.setEmpresa(d[2]);
			p.setEstado("ACTIVO");
			proveedoresRepository.save(p);
		}
	}

	private void seedClientes() {
		String[][] datos = {
				{ "SUPERMERCADO LA ESQUINA", "0414-1000001", "esquina@mail.com", "AV. PRINCIPAL LOCAL 1" },
				{ "ABASTO EL ÉXITO", "0414-1000002", "exito@mail.com", "CALLE 5 CON CARRERA 8" },
				{ "COMERCIAL SAN JOSÉ", "0414-1000003", "sanjose@mail.com", "URB. LOS ROSALES" },
				{ "MINI MARKET 24H", "0414-1000004", "24h@mail.com", "AV. BOLÍVAR EDIF. 12" },
				{ "DISTRIBUIDORA NORTE", "0414-1000005", "norte@mail.com", "ZONA INDUSTRIAL NORTE" },
				{ "ABASTO FAMILIAR", "0414-1000006", "familiar@mail.com", "SECTOR LA LAGUNA" },
				{ "COMERCIAL EL PARAÍSO", "0414-1000007", "paraiso@mail.com", "AV. INTERCOMUNAL" },
				{ "TIENDA LA ECONÓMICA", "0414-1000008", "economica@mail.com", "CALLE COMERCIO 45" },
				{ "MERCADO CENTRAL", "0414-1000009", "central@mail.com", "MERCADO MUNICIPAL PISO 2" },
				{ "ABASTO LOS SAMANES", "0414-1000010", "samanes@mail.com", "URB. SAMANES" },
				{ "COMERCIAL MIRAFLORES", "0414-1000011", "miraflores@mail.com", "AV. MIRAFLORES 200" },
				{ "MINI ABASTO EXPRESS", "0414-1000012", "express@mail.com", "SECTOR EL VALLE" },
				{ "DISTRIBUIDORA SUR", "0414-1000013", "sur@mail.com", "ZONA INDUSTRIAL SUR" },
				{ "COMERCIAL LA FUENTE", "0414-1000014", "lafuente@mail.com", "AV. LA FUENTE 88" },
				{ "ABASTO EL TRIGAL", "0414-1000015", "trigal@mail.com", "URB. EL TRIGAL" },
		};
		for (String[] d : datos) {
			Clientes c = new Clientes();
			c.setNombre(d[0]);
			c.setTelefono(d[1]);
			c.setCorreo(d[2]);
			c.setDireccion(d[3]);
			clientesRepository.save(c);
		}
	}

	private void seedMovimientos() {
		int[][] despachos = {
				{ 1, 1, 1, 10, 0 },
				{ 2, 2, 2, 5, 1 },
				{ 3, 3, 3, 15, 0 },
				{ 4, 4, 4, 8, 1 },
				{ 5, 5, 5, 12, 0 },
				{ 6, 6, 6, 6, 1 },
				{ 7, 7, 7, 20, 0 },
				{ 8, 8, 8, 4, 1 },
				{ 9, 9, 9, 25, 0 },
				{ 10, 10, 10, 7, 1 },
				{ 11, 11, 11, 9, 0 },
				{ 12, 12, 12, 11, 1 },
		};
		for (int[] d : despachos) {
			Movimientos m = new Movimientos();
			Productos producto = new Productos();
			producto.setId((long) d[0]);
			Vendedores vendedor = new Vendedores();
			vendedor.setId((long) d[1]);
			Clientes cliente = new Clientes();
			cliente.setId((long) d[2]);
			m.setProducto(producto);
			m.setVendedor(vendedor);
			m.setCliente(cliente);
			m.setCantidad(d[3]);
			m.setEstadoDespacho(d[4] == 1 ? "ENTREGADO" : "POR ENTREGAR");
			movimientosService.save(m);
		}
	}
}
