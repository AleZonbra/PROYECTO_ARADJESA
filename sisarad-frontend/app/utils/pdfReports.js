import jsPDF from "jspdf";

// Colores base inspirados en los estilos de la app
const PRIMARY_COLOR = [11, 61, 107]; // #0b3d6b
const TEXT_COLOR = [15, 23, 42]; // #0f172a
const MUTED_TEXT_COLOR = [71, 85, 105]; // #475569
const TABLE_HEADER_BG = [15, 23, 42]; // encabezados oscuros

const addLogoAndHeader = (doc, logoBase64, titulo, subtitulo) => {
  let currentY = 20;

  // Márgenes coherentes con el layout de la app
  const centerX = 105;

  if (logoBase64) {
    try {
      // Posicionamos el logo en la parte superior izquierda, similar al header web
      doc.addImage(logoBase64, "PNG", 15, 10, 30, 20);
      currentY = 35;
    } catch (e) {
      currentY = 20;
    }
  }

  // Título principal
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PRIMARY_COLOR);
  doc.setFontSize(16);
  doc.text(titulo, centerX, currentY, { align: "center" });
  currentY += 8;

  // Subtítulo en texto más suave
  if (subtitulo) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...TEXT_COLOR);
    doc.setFontSize(12);
    doc.text(subtitulo, centerX, currentY, { align: "center" });
    currentY += 8;
  }

  // Fecha
  const fechaTexto = `Fecha de generación: ${new Date().toLocaleDateString()}`;
  doc.setFontSize(10);
  doc.setTextColor(...MUTED_TEXT_COLOR);
  doc.text(fechaTexto, centerX, currentY, { align: "center" });

  // Línea divisoria inferior, similar a .reportHeader
  currentY += 6;
  doc.setDrawColor(51, 51, 51);
  doc.line(15, currentY, 195, currentY);

  // Restablecer color de texto base
  doc.setTextColor(...TEXT_COLOR);
  doc.setFont("helvetica", "normal");

  return currentY + 8;
};

export const generarPdfVehiculoDetalle = (vehiculo, logoBase64) => {
  if (!vehiculo) return;

  const doc = new jsPDF();
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...TEXT_COLOR);
  let y = addLogoAndHeader(
    doc,
    logoBase64,
    "Reporte Detallado de Vehículo",
    `${vehiculo.marca || ""} ${vehiculo.modelo || ""} - Placa: ${
      vehiculo.placa || ""
    }`
  );

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Datos del Vehículo", 15, y);
  y += 6;

  const secciones = [
    ["Marca", vehiculo.marca],
    ["Modelo", vehiculo.modelo],
    ["Año", vehiculo.anio],
    ["Placa", vehiculo.placa],
    [
      "Kilometraje Actual",
      vehiculo.kilometraje != null
        ? `${vehiculo.kilometraje.toLocaleString("es-ES")} km`
        : "N/A",
    ],
  ];

  secciones.forEach(([label, value]) => {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, 15, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(value ?? ""), 70, y);
    y += 6;
  });

  y += 4;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Historial de Kilometraje", 15, y);
  y += 6;

  const historial = (vehiculo.registroKilometraje || []).slice().sort((a, b) => {
    return (b.id || 0) - (a.id || 0);
  });

  if (!historial.length) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("No hay historial de kilometraje registrado.", 15, y);
  } else {
    // Encabezado de tabla con fondo oscuro y texto blanco
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setFillColor(...TABLE_HEADER_BG);
    doc.setTextColor(255, 255, 255);
    doc.rect(15, y - 5, 180, 8, "F");
    doc.text("ID", 18, y);
    doc.text("Kilometraje (km)", 55, y);
    doc.text("Fecha", 125, y);
    y += 6;

    // Filas de tabla con texto oscuro sobre fondo claro
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...TEXT_COLOR);

    historial.forEach((item, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      // Ligeras franjas para mejorar legibilidad
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252); // #f8fafc
        doc.rect(15, y - 4, 180, 7, "F");
      }

      doc.text(String(item.id ?? ""), 18, y);
      doc.text(
        item.kilometraje != null
          ? `${item.kilometraje.toLocaleString("es-ES")} km`
          : "N/A",
        55,
        y
      );
      doc.text(String(item.fecha ?? "N/A"), 125, y);
      y += 6;
    });
  }

  doc.save(`Reporte_Vehiculo_${vehiculo.placa || "sin_placa"}.pdf`);
};

export const generarPdfVehiculosGeneral = (vehiculos, logoBase64) => {
  if (!vehiculos || !vehiculos.length) return;

  const doc = new jsPDF();
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...TEXT_COLOR);
  let y = addLogoAndHeader(
    doc,
    logoBase64,
    "Inventario de Vehículos",
    "Listado general de vehículos"
  );

  // Encabezado de tabla de inventario
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setFillColor(...TABLE_HEADER_BG);
  doc.setTextColor(255, 255, 255);
  doc.rect(15, y - 5, 180, 8, "F");
  doc.text("ID", 18, y);
  doc.text("Marca", 32, y);
  doc.text("Modelo", 70, y);
  doc.text("Año", 110, y);
  doc.text("Placa", 130, y);
  doc.text("Kilometraje", 160, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...TEXT_COLOR);

  vehiculos.forEach((v, index) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    // Franja alternada para simular filas de tabla html
    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(15, y - 4, 180, 7, "F");
    }

    doc.setFontSize(10);
    doc.text(String(v.id ?? ""), 18, y);
    doc.text(String(v.marca ?? ""), 32, y);
    doc.text(String(v.modelo ?? ""), 70, y);
    doc.text(String(v.anio ?? ""), 110, y);
    doc.text(String(v.placa ?? ""), 130, y);
    doc.text(
      v.kilometraje != null
        ? `${v.kilometraje.toLocaleString("es-ES")} km`
        : "N/A",
      160,
      y
    );
    y += 6;
  });

  doc.save("Inventario_Vehiculos.pdf");
};

export const generarPdfRepuestosGeneral = (repuestos, logoBase64) => {
  if (!repuestos || !repuestos.length) return;

  const doc = new jsPDF();
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...TEXT_COLOR);
  let y = addLogoAndHeader(
    doc,
    logoBase64,
    "Inventario de Repuestos",
    "Listado general de repuestos"
  );

  // Encabezado de tabla de repuestos
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setFillColor(...TABLE_HEADER_BG);
  doc.setTextColor(255, 255, 255);
  doc.rect(15, y - 5, 180, 8, "F");
  doc.text("ID", 18, y);
  doc.text("Nombre", 35, y);
  doc.text("Precio ($)", 110, y);
  doc.text("Stock", 155, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...TEXT_COLOR);

  repuestos.forEach((r, index) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    // Filas alternas para mejorar legibilidad
    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(15, y - 4, 180, 7, "F");
    }

    doc.setFontSize(10);
    doc.text(String(r.id ?? ""), 18, y);
    doc.text(String(r.nombre ?? ""), 35, y);
    const precioText = r.precio != null ? `${r.precio} $` : "N/A";
    doc.text(precioText, 110, y);
    const stockText = r.stock != null ? String(r.stock) : "0";
    doc.text(stockText, 155, y);
    y += 6;
  });

  doc.save("Inventario_Repuestos.pdf");
};

export const generarPdfMantenimientoDetalle = (mantenimiento, logoBase64) => {
  if (!mantenimiento) return;

  const doc = new jsPDF();
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...TEXT_COLOR);
  let y = addLogoAndHeader(
    doc,
    logoBase64,
    "Reporte de Mantenimiento",
    `Vehículo ${mantenimiento.vehiculo?.placa || ""}`
  );

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Datos generales", 15, y);
  y += 6;

  const secciones = [
    ["N° de Orden", mantenimiento.id],
    ["Placa", mantenimiento.vehiculo?.placa],
    ["Tipo de Mantenimiento", mantenimiento.tipoMantenimiento],
    ["Descripción", mantenimiento.observacion],
    ["Fecha de Inicio", mantenimiento.fecha],
    ["Fecha de Culminación", mantenimiento.fechaCulminacion],
    [
      "Kilometraje Actual",
      mantenimiento.vehiculo?.kilometraje != null
        ? `${mantenimiento.vehiculo.kilometraje.toLocaleString("es-ES")} km`
        : "N/A",
    ],
    ["Costo Total", mantenimiento.costo != null ? `${mantenimiento.costo} $` : "N/A"],
  ];

  secciones.forEach(([label, value]) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, 15, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(value ?? ""), 70, y);
    y += 6;
  });

  y += 4;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Repuestos y servicios", 15, y);
  y += 6;

  const detalles = mantenimiento.detallesMantenimiento || [];

  if (!detalles.length) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("No hay detalles de mantenimiento registrados.", 15, y);
  } else {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setFillColor(...TABLE_HEADER_BG);
    doc.setTextColor(255, 255, 255);
    doc.rect(15, y - 5, 180, 8, "F");
    // Se da más espacio a la descripción del repuesto y se compactan las columnas numéricas
    doc.text("Repuesto", 18, y);
    doc.text("Cant.", 120, y);
    doc.text("Precio", 145, y);
    doc.text("Subtotal", 170, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...TEXT_COLOR);

    detalles.forEach((d, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(15, y - 4, 180, 7, "F");
      }

      // Mayor ancho para el nombre del repuesto; columnas numéricas más a la derecha
      doc.text(String(d.repuesto?.nombre ?? ""), 18, y);
      doc.text(String(d.cantidad ?? ""), 120, y);
      doc.text(
        d.repuesto?.precio != null ? `${d.repuesto.precio} $` : "N/A",
        145,
        y
      );
      doc.text(
        d.costoTotal != null ? `${d.costoTotal} $` : "N/A",
        170,
        y
      );
      y += 6;
    });
  }

  doc.save(
    `Reporte_Mantenimiento_${mantenimiento.id}_${
      mantenimiento.vehiculo?.placa || "sin_placa"
    }.pdf`
  );
};

export const generarPdfMantenimientosGeneral = (mantenimientos, logoBase64) => {
  if (!mantenimientos || !mantenimientos.length) return;

  const doc = new jsPDF();
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...TEXT_COLOR);
  let y = addLogoAndHeader(
    doc,
    logoBase64,
    "Historial de Mantenimiento",
    "Listado general de mantenimientos"
  );

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setFillColor(...TABLE_HEADER_BG);
  doc.setTextColor(255, 255, 255);
  doc.rect(10, y - 5, 185, 8, "F");
  doc.text("Orden", 12, y);
  doc.text("Placa", 28, y);
  // Se amplía el espacio para el tipo de mantenimiento moviendo las columnas de fecha y totales
  doc.text("Tipo", 48, y);
  doc.text("Inicio", 100, y);
  doc.text("Fin", 125, y);
  doc.text("Km", 150, y);
  doc.text("Total $", 175, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...TEXT_COLOR);

  mantenimientos.forEach((m, index) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(10, y - 4, 185, 7, "F");
    }

    doc.setFontSize(9);
    doc.text(String(m.id ?? ""), 12, y);
    doc.text(String(m.vehiculo?.placa ?? ""), 28, y);
  // Más espacio horizontal para descripciones largas del tipo de mantenimiento
  doc.text(String(m.tipoMantenimiento ?? ""), 48, y);
  doc.text(String(m.fecha ?? ""), 100, y);
  doc.text(String(m.fechaCulminacion ?? ""), 125, y);
    const kmText =
      m.vehiculo?.kilometraje != null
        ? `${m.vehiculo.kilometraje.toLocaleString("es-ES")} km`
        : "N/A";
    doc.text(kmText, 148, y);
    const costoText = m.costo != null ? `${m.costo} $` : "N/A";
    doc.text(costoText, 175, y);
    y += 6;
  });

  doc.save("Historial_Mantenimiento.pdf");
};
