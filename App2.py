import tkinter as tk
from tkinter import messagebox, ttk
import customtkinter as ctk
import sqlite3
from datetime import datetime

# Configuración de la base de datos e infraestructura relacional
conn = sqlite3.connect('sisarad.db')
cursor = conn.cursor()
cursor.execute('''CREATE TABLE IF NOT EXISTS productos (
                    id INTEGER PRIMARY KEY AUTOINCREMENT, 
                    producto TEXT, serial_lote TEXT, cantidad INTEGER, 
                    fecha_produccion TEXT, fecha_expiracion TEXT)''')
cursor.execute('''CREATE TABLE IF NOT EXISTS vendedores (
                    id INTEGER PRIMARY KEY AUTOINCREMENT, 
                    nombre TEXT, num_empleado TEXT, trabajos_realizados TEXT,
                    estado TEXT DEFAULT 'ACTIVO')''')
cursor.execute('''CREATE TABLE IF NOT EXISTS proveedores (
                    id INTEGER PRIMARY KEY AUTOINCREMENT, 
                    nombre TEXT, telefono TEXT, empresa TEXT,
                    estado TEXT DEFAULT 'ACTIVO')''')
cursor.execute('''CREATE TABLE IF NOT EXISTS clientes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT, 
                    nombre TEXT, telefono TEXT, correo TEXT,
                    direccion TEXT)''')
cursor.execute('''CREATE TABLE IF NOT EXISTS movimientos (
                    id INTEGER PRIMARY KEY AUTOINCREMENT, 
                    producto TEXT, vendedor TEXT, cliente TEXT, cantidad INTEGER,
                    fecha_salida TEXT, estado_despacho TEXT DEFAULT 'POR ENTREGAR')''')

# Migraciones seguras para nuevas columnas del sistema
try:
    cursor.execute("ALTER TABLE clientes ADD COLUMN direccion TEXT")
except sqlite3.OperationalError:
    pass
try:
    cursor.execute("ALTER TABLE movimientos ADD COLUMN estado_despacho TEXT DEFAULT 'POR ENTREGAR'")
except sqlite3.OperationalError:
    pass
conn.commit()

class SISARADApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Sistema de Información SISARAD")
        
        # Forzar el estado maximizado tras el ciclo de renderizado inicial
        self.root.after(100, lambda: self.root.state('zoomed'))
        self.root.configure(fg_color="#FFFFFF")
        
        # Configuración de estilos MODERNOS y FUENTES GRANDES para elementos TTK (Tablas)
        self.style = ttk.Style()
        self.style.theme_use("clam")
        self.style.configure("Treeview", background="#FFFFFF", foreground="#1E293B", fieldbackground="#FFFFFF", rowheight=42, font=("Segoe UI", 14))
        self.style.configure("Treeview.Heading", background="#F1F5F9", foreground="#002060", font=("Segoe UI", 14, "bold"), relief="flat")
        self.style.map("Treeview", background=[('selected', '#002060')], foreground=[('selected', '#FFFFFF')])
        
        # Interfaz de acceso / Login con fuentes escaladas
        self.login_frame = tk.Frame(self.root, bg="#002060", highlightthickness=1, highlightbackground="#00143A")
        self.login_frame.place(relx=0.5, rely=0.5, anchor="center", width=520, height=480)
        tk.Label(self.login_frame, text="SISARAD LOG IN", fg="#FFFFFF", bg="#002060", font=("Segoe UI", 26, "bold")).pack(pady=35)
        
        tk.Label(self.login_frame, text="Usuario:", fg="#F1F5F9", bg="#002060", font=("Segoe UI", 14)).pack(anchor="w", padx=50)
        self.user_entry = tk.Entry(self.login_frame, font=("Segoe UI", 15), bg="#F8FAFC", relief="flat", highlightthickness=1, highlightbackground="#CBD5E1", highlightcolor="#FFFFFF")
        self.user_entry.pack(fill="x", padx=50, pady=(5, 20), ipady=8)
        
        tk.Label(self.login_frame, text="Contraseña:", fg="#F1F5F9", bg="#002060", font=("Segoe UI", 14)).pack(anchor="w", padx=50)
        self.pass_entry = tk.Entry(self.login_frame, show="*", font=("Segoe UI", 15), bg="#F8FAFC", relief="flat", highlightthickness=1, highlightbackground="#CBD5E1", highlightcolor="#FFFFFF")
        self.pass_entry.pack(fill="x", padx=50, pady=(5, 5), ipady=8)
        
        lbl_olvido = tk.Label(self.login_frame, text="¿Olvidó su contraseña?", fg="#CBD5E1", bg="#002060", font=("Segoe UI", 12, "underline"), cursor="hand2")
        lbl_olvido.pack(anchor="w", padx=50, pady=6)
        lbl_olvido.bind("<Button-1>", lambda e: self.abrir_recuperacion())
        
        btn_login = tk.Button(self.login_frame, text="Ingresar", bg="#475569", fg="#FFFFFF", font=("Segoe UI", 15, "bold"), relief="flat", cursor="hand2", padx=35, pady=10, command=self.verificar_login)
        btn_login.pack(pady=25)
        self.aplicar_hover(btn_login, "#475569")

    def aplicar_hover(self, boton, color_original):
        if color_original == "#002060":
            color_hover = "#00143A"
        elif color_original == "#475569":
            color_hover = "#334155"
        else:
            color_hover = "#E2E8F0"
        boton.bind("<Enter>", lambda e: boton.config(bg=color_hover))
        boton.bind("<Leave>", lambda e: boton.config(bg=color_original))

    def verificar_login(self):
        if self.user_entry.get() == "admin" and self.pass_entry.get() == "admin":
            self.login_frame.destroy()
            self.cargar_dashboard()
        else:
            messagebox.showerror("Error de Ingreso", "Usuario o contraseña incorrectos.")

    def abrir_recuperacion(self):
        win_rec = tk.Toplevel(self.root)
        win_rec.title("Recuperación - Sistema de Puertas CANTV")
        win_rec.geometry("540x360")
        win_rec.configure(bg="#F8FAFC")
        win_rec.grab_set()
        win_rec.resizable(False, False)
        
        tk.Label(win_rec, text="MÓDULO DE VERIFICACIÓN INSTITUCIONAL", font=("Segoe UI", 15, "bold"), fg="#002060", bg="#F8FAFC").pack(pady=25)
        tk.Label(win_rec, text="Usuario a recuperar:", font=("Segoe UI", 13), fg="#334155", bg="#F8FAFC").pack(anchor="w", padx=45)
        ent_user = tk.Entry(win_rec, font=("Segoe UI", 13), bg="#FFFFFF", relief="flat", highlightthickness=1, highlightbackground="#CBD5E1", highlightcolor="#002060")
        ent_user.pack(fill="x", padx=45, pady=8, ipady=5)
        
        tk.Label(win_rec, text="Pregunta de Seguridad (Token de Puerta):", font=("Segoe UI", 13), fg="#334155", bg="#F8FAFC").pack(anchor="w", padx=45, pady=(5, 0))
        ent_resp = tk.Entry(win_rec, font=("Segoe UI", 13), bg="#FFFFFF", relief="flat", highlightthickness=1, highlightbackground="#CBD5E1", highlightcolor="#002060", show="*")
        ent_resp.pack(fill="x", padx=45, pady=8, ipady=5)
        
        def validar_cantv():
            if ent_user.get().strip() == "admin" and ent_resp.get().strip() == "SISARAD2026":
                messagebox.showinfo("Acceso Validado", "Identidad confirmada con éxito.\nLa contraseña maestra ha sido restablecida a: admin", parent=win_rec)
                win_rec.destroy()
            else:
                messagebox.showerror("Fallo de Autenticación", "Los datos ingresados no coinciden con los registros de seguridad del proyecto CANTV.", parent=win_rec)
                
        btn_validar = tk.Button(win_rec, text="Validar y Restablecer", bg="#002060", fg="#FFFFFF", font=("Segoe UI", 13, "bold"), relief="flat", cursor="hand2", pady=8, command=validar_cantv)
        btn_validar.pack(pady=20)
        self.aplicar_hover(btn_validar, "#002060")

    def cargar_dashboard(self):
        # Arreglo de Barra Lateral: Ancho expandido a 300 para fuentes grandes sin compresión
        self.sidebar = tk.Frame(self.root, bg="#002060", width=300)
        self.sidebar.pack(side="left", fill="y")
        self.sidebar.pack_propagate(False)
        
        # Botón Toggle perfectamente ubicado y libre de artefactos visuales
        self.btn_toggle = tk.Button(self.root, text="☰", bg="#002060", fg="#FFFFFF", font=("Segoe UI", 18, "bold"), relief="flat", bd=0, highlightthickness=0, cursor="hand2", command=self.toggle_sidebar)
        self.btn_toggle.place(x=15, y=15, width=45, height=45)
        
        def on_enter(e):
            if self.sidebar.winfo_manager():
                self.btn_toggle.config(bg="#00143A")
            else:
                self.btn_toggle.config(bg="#E2E8F0")
                
        def on_leave(e):
            if self.sidebar.winfo_manager():
                self.btn_toggle.config(bg="#002060")
            else:
                self.btn_toggle.config(bg="#FFFFFF")
                
        self.btn_toggle.bind("<Enter>", on_enter)
        self.btn_toggle.bind("<Leave>", on_leave)
        
        # Título de la barra lateral: Fuente aumentada y coordenadas fijas
        self.lbl_titulo = tk.Label(self.sidebar, text="SISARAD", fg="#FFFFFF", bg="#002060", font=("Segoe UI", 24, "bold"))
        self.lbl_titulo.place(x=75, y=16)
        
        # Botón Cerrar redondeado y grande con customtkinter
        btn_cerrar = ctk.CTkButton(self.sidebar, text="  Cerrar Sistema", fg_color="#475569", text_color="#FFFFFF", font=("Segoe UI", 15, "bold"), anchor="w", corner_radius=8, height=52, hover_color="#334155", command=self.root.destroy)
        btn_cerrar.pack(side="bottom", fill="x", padx=20, pady=35)
        
        # Botones del Menú: Se cambia el nombre visual de "Historial" a "Historial Despachos" para mayor claridad
        menu_opciones = [("Inicio", "Inicio"), ("Productos", "Productos"), ("Vendedores", "Vendedores"), ("Proveedores", "Proveedores"), ("Clientes", "Clientes"), ("Historial", "Historial Despachos"), ("Exportar", "Exportar")]
        for i, (vista_id, opc_texto) in enumerate(menu_opciones):
            v_pady = (90, 8) if i == 0 else 8
            btn_opc = ctk.CTkButton(self.sidebar, text=f"  {opc_texto}", fg_color="#475569", text_color="#FFFFFF", font=("Segoe UI", 16), anchor="w", corner_radius=8, height=48, hover_color="#334155", command=lambda o=vista_id: self.mostrar_vista(o))
            btn_opc.pack(fill="x", padx=20, pady=v_pady)
        
        # Área de contenido dinámico y scrollable
        self.container = tk.Frame(self.root, bg="#FFFFFF")
        self.container.pack(side="right", fill="both", expand=True)
        
        self.canvas = tk.Canvas(self.container, bg="#FFFFFF", highlightthickness=0)
        self.scrollbar = ttk.Scrollbar(self.container, orient="vertical", command=self.canvas.yview)
        self.contenido = tk.Frame(self.canvas, bg="#FFFFFF")
        
        self.canvas_window = self.canvas.create_window((0, 0), window=self.contenido, anchor="nw")
        
        self.contenido.bind("<Configure>", lambda e: self.canvas.configure(scrollregion=self.canvas.bbox("all")))
        self.canvas.bind("<Configure>", lambda e: self.canvas.itemconfigure(self.canvas_window, width=e.width))
        self.canvas.configure(yscrollcommand=self.scrollbar.set)
        
        self.canvas.pack(side="left", fill="both", expand=True)
        self.scrollbar.pack(side="right", fill="y")
        
        self.canvas.bind_all("<MouseWheel>", lambda e: self.canvas.yview_scroll(int(-1 * (e.delta / 120)), "units"))
        
        self.lbl_reloj = tk.Label(self.container, text="", fg="#002060", bg="#FFFFFF", font=("Segoe UI", 14, "bold"))
        self.lbl_reloj.place(relx=1.0, rely=0.0, anchor="ne", x=-35, y=18)
        self.actualizar_reloj()
        self.mostrar_vista("Inicio")

    def toggle_sidebar(self):
        if self.sidebar.winfo_manager():
            self.sidebar.pack_forget()
            self.btn_toggle.config(bg="#FFFFFF", fg="#002060")
        else:
            self.sidebar.pack(side="left", fill="y")
            self.btn_toggle.config(bg="#002060", fg="#FFFFFF")
        self.btn_toggle.lift()

    def actualizar_reloj(self):
        self.lbl_reloj.config(text=datetime.now().strftime("%d/%m/%Y  |  %H:%M:%S"))
        self.root.after(1000, self.actualizar_reloj)

    def text_to_upper(self, event):
        pass

    def formatear_fecha(self, event):
        if event.keysym == "Backspace":
            return
        entry = event.widget
        texto = entry.get().replace("/", "")
        texto = "".join([c for c in texto if c.isdigit()])[:8]
        nuevo_texto = ""
        if len(texto) > 0: nuevo_texto += texto[:2]
        if len(texto) > 2: nuevo_texto += "/" + texto[2:4]
        if len(texto) > 4: nuevo_texto += "/" + texto[4:8]
        entry.delete(0, tk.END)
        entry.insert(0, nuevo_texto)

    def mostrar_vista(self, vista):
        for widget in self.contenido.winfo_children():
            widget.destroy()
        
        self.canvas.yview_moveto(0)
            
        if vista == "Inicio":
            tk.Label(self.contenido, text="    Tablero de Control Metrónico Semanal", font=("Segoe UI", 32, "bold"), fg="#002060", bg="#FFFFFF").pack(pady=30, anchor="w", padx=40)
            
            filtro_semanal = "WHERE strftime('%Y-%W', substr(fecha_salida, 7, 4) || '-' || substr(fecha_salida, 4, 2) || '-' || substr(fecha_salida, 1, 2)) = strftime('%Y-%W', 'now')"
            
            cursor.execute(f"SELECT COALESCE(SUM(cantidad), 0) FROM movimientos {filtro_semanal}")
            prod_sem = cursor.fetchone()[0]
            cursor.execute(f"SELECT COUNT(DISTINCT vendedor) FROM movimientos {filtro_semanal}")
            vend_sem = cursor.fetchone()[0]
            cursor.execute(f"SELECT COUNT(DISTINCT cliente) FROM movimientos {filtro_semanal}")
            clie_sem = cursor.fetchone()[0]
            cursor.execute(f"SELECT COUNT(*) FROM movimientos {filtro_semanal}")
            movs_sem = cursor.fetchone()[0]
            
            cursor.execute(f"""SELECT v.nombre, SUM(m.cantidad) as total FROM movimientos m 
                               JOIN vendedores v ON m.vendedor = v.id 
                               WHERE strftime('%Y-%W', substr(m.fecha_salida, 7, 4) || '-' || substr(m.fecha_salida, 4, 2) || '-' || substr(m.fecha_salida, 1, 2)) = strftime('%Y-%W', 'now') 
                               GROUP BY m.vendedor ORDER BY total DESC LIMIT 1""")
            res_vendedor = cursor.fetchone()
            top_vendedor = res_vendedor[0] if res_vendedor else "NINGUNO"
            
            cursor.execute(f"""SELECT p.producto, SUM(m.cantidad) as total FROM movimientos m 
                               JOIN productos p ON m.producto = p.id 
                               WHERE strftime('%Y-%W', substr(m.fecha_salida, 7, 4) || '-' || substr(m.fecha_salida, 4, 2) || '-' || substr(m.fecha_salida, 1, 2)) = strftime('%Y-%W', 'now') 
                               GROUP BY m.producto ORDER BY total DESC LIMIT 1""")
            res_producto = cursor.fetchone()
            top_producto = res_producto[0] if res_producto else "NINGUNO"
            
            kpi_frame = tk.Frame(self.contenido, bg="#FFFFFF")
            kpi_frame.pack(anchor="w", padx=40, pady=5, fill="x")
            
            card_data = [
                ("Unidades Movidas (Sem.)", prod_sem, "#002060"),
                ("Vendedores Activos (Sem.)", vend_sem, "#475569"),
                ("Clientes Atendidos (Sem.)", clie_sem, "#002060"),
                ("Despachos Procesados (Sem.)", movs_sem, "#475569"),
                ("Líder de Ventas (Sem.)", top_vendedor, "#002060"),
                ("Producto Más Despachado (Sem.)", top_producto, "#475569")
            ]
            
            for i, (tit, val, col) in enumerate(card_data):
                card = tk.Frame(kpi_frame, bg="#F8FAFC", highlightthickness=1, highlightbackground="#E2E8F0", width=360, height=150)
                card.grid(row=i//3, column=i%3, padx=15, pady=15)
                card.pack_propagate(False)
                tk.Label(card, text=tit, font=("Segoe UI", 14, "bold"), fg=col, bg="#F8FAFC").pack(pady=15)
                font_kpi = ("Segoe UI", 28, "bold") if isinstance(val, int) or str(val).isdigit() else ("Segoe UI", 16, "bold")
                tk.Label(card, text=str(val), font=font_kpi, fg="#1E293B", bg="#F8FAFC", wraplength=330, justify="center").pack()

            tk.Label(self.contenido, text="Productos próximos a vencer", font=("Segoe UI", 20, "bold"), fg="#002060", bg="#FFFFFF").pack(pady=(30, 8), anchor="w", padx=40)
            
            tabla_venc = ttk.Treeview(self.contenido, columns=("id", "prod", "lote", "cant", "f_exp"), show="headings", height=4)
            for c, t, w in [("id", "ID", 80), ("prod", "PRODUCTO", 320), ("lote", "SERIAL LOTE", 200), ("cant", "CANT", 100), ("f_exp", "FECHA VENCIMIENTO", 220)]:
                tabla_venc.heading(c, text=t)
                tabla_venc.column(c, width=w, anchor="center" if c != "prod" else "w")
            tabla_venc.pack(anchor="w", padx=40, pady=5)
            
            cursor.execute("""SELECT id, producto, serial_lote, cantidad, fecha_expiracion 
                              FROM productos 
                              WHERE substr(fecha_expiracion, 7, 4) || '-' || substr(fecha_expiracion, 4, 2) || '-' || substr(fecha_expiracion, 1, 2) >= date('now')
                              ORDER BY substr(fecha_expiracion, 7, 4) || '-' || substr(fecha_expiracion, 4, 2) || '-' || substr(fecha_expiracion, 1, 2) ASC 
                              LIMIT 4""")
            for row in cursor.fetchall():
                tabla_venc.insert("", tk.END, values=row)

            info_frame = tk.Frame(self.contenido, bg="#F8FAFC", highlightthickness=1, highlightbackground="#E2E8F0", padx=25, pady=20)
            info_frame.pack(anchor="w", padx=40, pady=30, fill="x")
            tk.Label(info_frame, text="MÉTRICAS OPERATIVAS DE RENDIMIENTO", font=("Segoe UI", 15, "bold"), fg="#002060", bg="#F8FAFC").pack(anchor="w")
            tk.Label(info_frame, text="Los datos superiores reflejan estrictamente los movimientos auditados durante la presente semana calendario, calculando dinámicamente los liderazgos de venta, rotación y alertas tempranas de inventario por expirar.", font=("Segoe UI", 13), fg="#475569", bg="#F8FAFC", justify="left", wraplength=1000).pack(anchor="w", pady=8)

        elif vista == "Productos":
            tk.Label(self.contenido, text="Módulo de Productos", font=("Segoe UI", 28, "bold"), fg="#002060", bg="#FFFFFF").pack(pady=25, anchor="w", padx=40)
            self.tabla_prod = ttk.Treeview(self.contenido, columns=("id", "prod", "serial", "cant", "f_prod", "f_exp"), show="headings", height=12)
            for c, t, w in [("id", "ID", 80), ("prod", "PRODUCTO", 300), ("serial", "SERIAL LOTE", 200), ("cant", "CANT", 100), ("f_prod", "F. PRODUCCIÓN", 160), ("f_exp", "F. EXPIRACIÓN", 160)]:
                self.tabla_prod.heading(c, text=t)
                self.tabla_prod.column(c, width=w, anchor="center" if c!="prod" else "w")
            self.tabla_prod.pack(anchor="w", padx=40, pady=5)
            self.tabla_prod.bind("<<TreeviewSelect>>", self.cargar_prod_campos)
            
            f = tk.Frame(self.contenido, bg="#FFFFFF")
            f.pack(anchor="w", padx=40, pady=20)
            self.p_entries = {}
            lbls = ["Producto:", "Serial Lote:", "Cantidad:", "F. Producción:", "F. Expiración:"]
            for i, l in enumerate(lbls):
                tk.Label(f, text=l, bg="#FFFFFF", fg="#002060", font=("Segoe UI", 13, "bold")).grid(row=i//3, column=(i%3)*2, sticky="w", padx=10, pady=10)
                e = tk.Entry(f, width=24, font=("Segoe UI", 13), bg="#F8FAFC", relief="flat", highlightthickness=1, highlightbackground="#CBD5E1", highlightcolor="#002060")
                e.grid(row=i//3, column=(i%3)*2+1, padx=15, pady=10, ipady=6)
                self.p_entries[l] = e
                if "F. Producción" in l or "F. Expiración" in l: e.bind("<KeyRelease>", self.formatear_fecha)
                
            fb = tk.Frame(self.contenido, bg="#FFFFFF")
            fb.pack(anchor="w", padx=40, pady=15)
            btn1 = tk.Button(fb, text="Registrar", bg="#002060", fg="#FFFFFF", font=("Segoe UI", 13, "bold"), relief="flat", cursor="hand2", padx=20, pady=8, command=self.reg_prod); btn1.pack(side="left", padx=8)
            btn2 = tk.Button(fb, text="Modificar", bg="#475569", fg="#FFFFFF", font=("Segoe UI", 13, "bold"), relief="flat", cursor="hand2", padx=20, pady=8, command=self.mod_prod); btn2.pack(side="left", padx=8)
            btn3 = tk.Button(fb, text="Eliminar", bg="#002060", fg="#FFFFFF", font=("Segoe UI", 13, "bold"), relief="flat", cursor="hand2", padx=20, pady=8, command=self.eli_prod); btn3.pack(side="left", padx=8)
            for b, c in [(btn1, "#002060"), (btn2, "#475569"), (btn3, "#002060")]: self.aplicar_hover(b, c)
            self.act_tabla_prod()

        elif vista == "Vendedores":
            tk.Label(self.contenido, text="Módulo de Vendedores", font=("Segoe UI", 28, "bold"), fg="#002060", bg="#FFFFFF").pack(pady=25, anchor="w", padx=40)
            self.tabla_vend = ttk.Treeview(self.contenido, columns=("id", "nom", "emp", "trab", "est"), show="headings", height=12)
            for c, t, w in [("id", "ID", 80), ("nom", "NOMBRE", 280), ("emp", "N° EMPLEADO", 160), ("trab", "TRABAJOS REALIZADOS", 280), ("est", "ESTADO", 140)]:
                self.tabla_vend.heading(c, text=t)
                self.tabla_vend.column(c, width=w, anchor="center" if c in ["id","emp","est"] else "w")
            self.tabla_vend.pack(anchor="w", padx=40, pady=5)
            self.tabla_vend.bind("<<TreeviewSelect>>", self.cargar_vend_campos)
            
            f = tk.Frame(self.contenido, bg="#FFFFFF")
            f.pack(anchor="w", padx=40, pady=20)
            self.v_entries = {}
            lbls = ["Nombre:", "N° Empleado:", "Trabajos:"]
            for i, l in enumerate(lbls):
                tk.Label(f, text=l, bg="#FFFFFF", fg="#002060", font=("Segoe UI", 13, "bold")).grid(row=0, column=i*2, sticky="w", padx=10, pady=10)
                e = tk.Entry(f, width=24, font=("Segoe UI", 13), bg="#F8FAFC", relief="flat", highlightthickness=1, highlightbackground="#CBD5E1", highlightcolor="#002060")
                e.grid(row=0, column=i*2+1, padx=15, pady=10, ipady=6)
                self.v_entries[l] = e
                
            fb = tk.Frame(self.contenido, bg="#FFFFFF")
            fb.pack(anchor="w", padx=40, pady=15)
            btn1 = tk.Button(fb, text="Registrar", bg="#002060", fg="#FFFFFF", font=("Segoe UI", 13, "bold"), relief="flat", cursor="hand2", padx=20, pady=8, command=self.reg_vend); btn1.pack(side="left", padx=8)
            btn2 = tk.Button(fb, text="Modificar", bg="#475569", fg="#FFFFFF", font=("Segoe UI", 13, "bold"), relief="flat", cursor="hand2", padx=20, pady=8, command=self.mod_vend); btn2.pack(side="left", padx=8)
            btn3 = tk.Button(fb, text="Alternar Estado", bg="#475569", fg="#FFFFFF", font=("Segoe UI", 13, "bold"), relief="flat", cursor="hand2", padx=20, pady=8, command=self.alt_estado_vend); btn3.pack(side="left", padx=8)
            btn4 = tk.Button(fb, text="Eliminar", bg="#002060", fg="#FFFFFF", font=("Segoe UI", 13, "bold"), relief="flat", cursor="hand2", padx=20, pady=8, command=self.eli_vend); btn4.pack(side="left", padx=8)
            for b, c in [(btn1, "#002060"), (btn2, "#475569"), (btn3, "#475569"), (btn4, "#002060")]: self.aplicar_hover(b, c)
            self.act_tabla_vend()

        elif vista == "Proveedores":
            tk.Label(self.contenido, text="Módulo de Proveedores", font=("Segoe UI", 28, "bold"), fg="#002060", bg="#FFFFFF").pack(pady=25, anchor="w", padx=40)
            self.tabla_prov = ttk.Treeview(self.contenido, columns=("id", "nom", "tel", "emp", "est"), show="headings", height=12)
            for c, t, w in [("id", "ID", 80), ("nom", "NOMBRE PROVEEDOR", 280), ("tel", "TELÉFONO", 180), ("emp", "EMPRESA / MARCA", 260), ("est", "ESTADO", 140)]:
                self.tabla_prov.heading(c, text=t)
                self.tabla_prov.column(c, width=w, anchor="center" if c in ["id","tel","est"] else "w")
            self.tabla_prov.pack(anchor="w", padx=40, pady=5)
            self.tabla_prov.bind("<<TreeviewSelect>>", self.cargar_prov_campos)
            
            f = tk.Frame(self.contenido, bg="#FFFFFF")
            f.pack(anchor="w", padx=40, pady=20)
            self.prov_entries = {}
            lbls = ["Nombre:", "Teléfono:", "Empresa:"]
            for i, l in enumerate(lbls):
                tk.Label(f, text=l, bg="#FFFFFF", fg="#002060", font=("Segoe UI", 13, "bold")).grid(row=0, column=i*2, sticky="w", padx=10, pady=10)
                e = tk.Entry(f, width=24, font=("Segoe UI", 13), bg="#F8FAFC", relief="flat", highlightthickness=1, highlightbackground="#CBD5E1", highlightcolor="#002060")
                e.grid(row=0, column=i*2+1, padx=15, pady=10, ipady=6)
                self.prov_entries[l] = e
                
            fb = tk.Frame(self.contenido, bg="#FFFFFF")
            fb.pack(anchor="w", padx=40, pady=15)
            btn1 = tk.Button(fb, text="Registrar", bg="#002060", fg="#FFFFFF", font=("Segoe UI", 13, "bold"), relief="flat", cursor="hand2", padx=20, pady=8, command=self.reg_prov); btn1.pack(side="left", padx=8)
            btn2 = tk.Button(fb, text="Modificar", bg="#475569", fg="#FFFFFF", font=("Segoe UI", 13, "bold"), relief="flat", cursor="hand2", padx=20, pady=8, command=self.mod_prov); btn2.pack(side="left", padx=8)
            btn3 = tk.Button(fb, text="Alternar Estado", bg="#475569", fg="#FFFFFF", font=("Segoe UI", 13, "bold"), relief="flat", cursor="hand2", padx=20, pady=8, command=self.alt_estado_prov); btn3.pack(side="left", padx=8)
            btn4 = tk.Button(fb, text="Eliminar", bg="#002060", fg="#FFFFFF", font=("Segoe UI", 13, "bold"), relief="flat", cursor="hand2", padx=20, pady=8, command=self.eli_prov); btn4.pack(side="left", padx=8)
            for b, c in [(btn1, "#002060"), (btn2, "#475569"), (btn3, "#475569"), (btn4, "#002060")]: self.aplicar_hover(b, c)
            self.act_tabla_prov()

        elif vista == "Clientes":
            tk.Label(self.contenido, text="Módulo de Clientes", font=("Segoe UI", 28, "bold"), fg="#002060", bg="#FFFFFF").pack(pady=25, anchor="w", padx=40)
            split_frame = tk.Frame(self.contenido, bg="#FFFFFF")
            split_frame.pack(anchor="w", padx=40, pady=5, fill="x")
            
            self.tabla_clie = ttk.Treeview(split_frame, columns=("id", "nom", "tel", "cor"), show="headings", height=12)
            for c, t, w in [("id", "ID", 70), ("nom", "NOMBRE COMPLETO", 280), ("tel", "TELÉFONO", 160), ("cor", "CORREO ELECTRÓNICO", 260)]:
                self.tabla_clie.heading(c, text=t)
                self.tabla_clie.column(c, width=w, anchor="center" if c in ["id","tel"] else "w")
            self.tabla_clie.pack(side="left")
            self.tabla_clie.bind("<<TreeviewSelect>>", self.cargar_clie_campos)
            
            self.panel_direccion = tk.LabelFrame(split_frame, text=" DIRECCIÓN DEL CLIENTE ", font=("Segoe UI", 13, "bold"), fg="#002060", bg="#F8FAFC", relief="flat", highlightthickness=1, highlightbackground="#E2E8F0")
            self.panel_direccion.pack(side="left", padx=25, fill="both", expand=True)
            self.panel_direccion.pack_propagate(False)
            
            self.lbl_direccion_display = tk.Label(self.panel_direccion, text="SELECCIONE UN CLIENTE\nPARA VER SU DIRECCIÓN", font=("Segoe UI", 13, "italic"), fg="#475569", bg="#F8FAFC", justify="center", wraplength=300)
            self.lbl_direccion_display.pack(expand=True, fill="both", padx=15, pady=15)
            
            f = tk.Frame(self.contenido, bg="#FFFFFF")
            f.pack(anchor="w", padx=40, pady=20)
            self.c_entries = {}
            lbls = ["Nombre:", "Teléfono:", "Correo:", "Dirección:"]
            for i, l in enumerate(lbls):
                tk.Label(f, text=l, bg="#FFFFFF", fg="#002060", font=("Segoe UI", 13, "bold")).grid(row=i//2, column=(i%2)*2, sticky="w", padx=10, pady=10)
                e = tk.Entry(f, width=30, font=("Segoe UI", 13), bg="#F8FAFC", relief="flat", highlightthickness=1, highlightbackground="#CBD5E1", highlightcolor="#002060")
                e.grid(row=i//2, column=(i%2)*2+1, padx=15, pady=10, ipady=6)
                self.c_entries[l] = e
                
            fb = tk.Frame(self.contenido, bg="#FFFFFF")
            fb.pack(anchor="w", padx=40, pady=15)
            btn1 = tk.Button(fb, text="Registrar", bg="#002060", fg="#FFFFFF", font=("Segoe UI", 13, "bold"), relief="flat", cursor="hand2", padx=20, pady=8, command=self.reg_clie); btn1.pack(side="left", padx=8)
            btn2 = tk.Button(fb, text="Modificar", bg="#475569", fg="#FFFFFF", font=("Segoe UI", 13, "bold"), relief="flat", cursor="hand2", padx=20, pady=8, command=self.mod_clie); btn2.pack(side="left", padx=8)
            btn3 = tk.Button(fb, text="Eliminar", bg="#002060", fg="#FFFFFF", font=("Segoe UI", 13, "bold"), relief="flat", cursor="hand2", padx=20, pady=8, command=self.eli_clie); btn3.pack(side="left", padx=8)
            for b, c in [(btn1, "#002060"), (btn2, "#475569"), (btn3, "#002060")]: self.aplicar_hover(b, c)
            self.act_tabla_clie()

        elif vista == "Historial":
            # REFACTORIZACIÓN COMPLETA: Cambios de Salidas a Despachos e integración de Estado
            tk.Label(self.contenido, text="Entorno General de Historial y Despachos", font=("Segoe UI", 28, "bold"), fg="#002060", bg="#FFFFFF").pack(pady=20, anchor="w", padx=40)
            
            self.ultimo_mov_frame = tk.LabelFrame(self.contenido, text=" DATOS DEL ÚLTIMO DESPACHO REALIZADO ", font=("Segoe UI", 12, "bold"), fg="#002060", bg="#F8FAFC", relief="flat", highlightthickness=1, highlightbackground="#CBD5E1")
            self.ultimo_mov_frame.pack(anchor="w", padx=40, pady=5, fill="x", expand=False)
            self.lbl_ultimo_mov_desc = tk.Label(self.ultimo_mov_frame, text="NINGÚN DESPACHO DETECTADO EN ESTA SESIÓN", font=("Segoe UI", 13, "bold"), fg="#475569", bg="#F8FAFC", pady=15)
            self.lbl_ultimo_mov_desc.pack(anchor="w", padx=15)
            self.actualizar_banner_ultimo_mov()

            f = tk.Frame(self.contenido, bg="#FFFFFF")
            f.pack(anchor="w", padx=40, pady=20)
            self.h_id_sel = None 
            
            campos_hist = [("ID Producto:", "m_prod", 11), ("ID Vendedor:", "m_vend", 11), ("ID Cliente:", "m_clie", 11), ("Cantidad:", "m_cant", 9)]
            for i, (lbl_t, attr, w) in enumerate(campos_hist):
                tk.Label(f, text=lbl_t, bg="#FFFFFF", fg="#002060", font=("Segoe UI", 13, "bold")).grid(row=0, column=i*2, padx=10, pady=10, sticky="w")
                e = tk.Entry(f, width=w, font=("Segoe UI", 13), bg="#F8FAFC", relief="flat", highlightthickness=1, highlightbackground="#CBD5E1", highlightcolor="#002060")
                e.grid(row=0, column=i*2+1, padx=12, pady=10, ipady=6)
                setattr(self, attr, e)
            
            # Incorporación del Selector Desplegable para el Estado del Despacho
            tk.Label(f, text="Estado Despacho:", bg="#FFFFFF", fg="#002060", font=("Segoe UI", 13, "bold")).grid(row=0, column=8, padx=10, pady=10, sticky="w")
            self.m_estado = ttk.Combobox(f, values=["POR ENTREGAR", "ENTREGADO"], font=("Segoe UI", 13), state="readonly", width=15)
            self.m_estado.grid(row=0, column=9, padx=12, pady=10, ipady=4)
            self.m_estado.set("POR ENTREGAR")
            
            fb = tk.Frame(self.contenido, bg="#FFFFFF")
            fb.pack(anchor="w", padx=40, pady=15)
            btn1 = tk.Button(fb, text="Registrar Nuevo Despacho", bg="#002060", fg="#FFFFFF", font=("Segoe UI", 13, "bold"), relief="flat", cursor="hand2", padx=18, pady=8, command=self.reg_mov)
            btn1.pack(side="left", padx=8)
            btn2 = tk.Button(fb, text="Modificar Registro Seleccionado", bg="#475569", fg="#FFFFFF", font=("Segoe UI", 13, "bold"), relief="flat", cursor="hand2", padx=18, pady=8, command=self.mod_mov)
            btn2.pack(side="left", padx=8)
            btn3 = tk.Button(fb, text="Eliminar Registro", bg="#002060", fg="#FFFFFF", font=("Segoe UI", 13, "bold"), relief="flat", cursor="hand2", padx=18, pady=8, command=self.eli_mov)
            btn3.pack(side="left", padx=8)
            for b, c in [(btn1, "#002060"), (btn2, "#475569"), (btn3, "#002060")]: self.aplicar_hover(b, c)

            # Reestructuración de columnas para incluir de manera fija el Estado en la tabla principal
            self.tabla_hist = ttk.Treeview(self.contenido, columns=("id", "prod", "vend", "clie", "cant", "f_salida", "estado"), show="headings", height=10)
            for c, t, w in [("id", "ID DESP.", 90), ("prod", "PRODUCTO", 230), ("vend", "VENDEDOR", 190), ("clie", "CLIENTE COMPRADOR", 230), ("cant", "CANT.", 80), ("f_salida", "FECHA DESPACHO", 150), ("estado", "ESTADO DESPACHO", 160)]:
                self.tabla_hist.heading(c, text=t)
                self.tabla_hist.column(c, width=w, anchor="center" if c in ["id", "cant", "f_salida", "estado"] else "w")
            self.tabla_hist.pack(anchor="w", padx=40, pady=20)
            self.tabla_hist.bind("<<TreeviewSelect>>", self.cargar_mov_campos)
            self.act_tabla_hist()

        elif vista == "Exportar":
            tk.Label(self.contenido, text="Exportación de Datos", font=("Segoe UI", 28, "bold"), fg="#002060", bg="#FFFFFF").pack(pady=50, anchor="w", padx=40)
            btn1 = tk.Button(self.contenido, text="Exportar Productos a CSV", bg="#002060", fg="#FFFFFF", font=("Segoe UI", 14, "bold"), relief="flat", cursor="hand2", width=32, pady=10, command=lambda: messagebox.showinfo("Exportar", "Función de exportación de Productos a CSV iniciada.")); btn1.pack(anchor="w", padx=40, pady=15)
            btn2 = tk.Button(self.contenido, text="Exportar Vendedores a CSV", bg="#475569", fg="#FFFFFF", font=("Segoe UI", 14, "bold"), relief="flat", cursor="hand2", width=32, pady=10, command=lambda: messagebox.showinfo("Exportar", "Función de exportación de Vendedores a CSV iniciada.")); btn2.pack(anchor="w", padx=40, pady=15)
            self.aplicar_hover(btn1, "#002060")
            self.aplicar_hover(btn2, "#475569")

    # Lógica de Productos
    def act_tabla_prod(self):
        for r in self.tabla_prod.get_children(): self.tabla_prod.delete(r)
        cursor.execute("SELECT id, producto, serial_lote, cantidad, fecha_produccion, fecha_expiracion FROM productos")
        for f in cursor.fetchall(): self.tabla_prod.insert("", tk.END, values=f)
    def cargar_prod_campos(self, e):
        sel = self.tabla_prod.selection()
        if sel:
            val = self.tabla_prod.item(sel[0])['values']
            for i, l in enumerate(["Producto:", "Serial Lote:", "Cantidad:", "F. Producción:", "F. Expiración:"]):
                self.p_entries[l].delete(0, tk.END)
                self.p_entries[l].insert(0, val[i+1])
    def reg_prod(self):
        v = [self.p_entries[l].get().strip().upper() for l in ["Producto:", "Serial Lote:", "Cantidad:", "F. Producción:", "F. Expiración:"]]
        if "" in v: return messagebox.showerror("Error de Datos", "No se permiten espacios en blanco.")
        if not v[2].isdigit(): return messagebox.showerror("Error de Datos", "La cantidad debe ser un número entero.")
        cursor.execute("INSERT INTO productos (producto, serial_lote, cantidad, fecha_produccion, fecha_expiracion) VALUES (?,?,?,?,?)", (v[0], v[1], int(v[2]), v[3], v[4]))
        conn.commit(); self.act_tabla_prod()
        for entry in self.p_entries.values(): entry.delete(0, tk.END)
        messagebox.showinfo("Éxito", "Producto registrado correctamente.")
    def mod_prod(self):
        sel = self.tabla_prod.selection()
        if not sel: return messagebox.showerror("Error", "Seleccione un producto de la lista.")
        v = [self.p_entries[l].get().strip().upper() for l in ["Producto:", "Serial Lote:", "Cantidad:", "F. Producción:", "F. Expiración:"]]
        if "" in v: return messagebox.showerror("Error de Datos", "No se permiten espacios en blanco.")
        cursor.execute("UPDATE productos SET producto=?, serial_lote=?, cantidad=?, fecha_produccion=?, fecha_expiracion=? WHERE id=?", (v[0], v[1], int(v[2]), v[3], v[4], self.tabla_prod.item(sel[0])['values'][0]))
        conn.commit(); self.act_tabla_prod()
        for entry in self.p_entries.values(): entry.delete(0, tk.END)
        messagebox.showinfo("Éxito", "Producto modificado correctamente.")
    def eli_prod(self):
        sel = self.tabla_prod.selection()
        if sel:
            cursor.execute("DELETE FROM productos WHERE id=?", (self.tabla_prod.item(sel[0])['values'][0],))
            conn.commit(); self.act_tabla_prod()
            for entry in self.p_entries.values(): entry.delete(0, tk.END)

    # Lógica de Vendedores
    def act_tabla_vend(self):
        for r in self.tabla_vend.get_children(): self.tabla_vend.delete(r)
        cursor.execute("SELECT id, nombre, num_empleado, trabajos_realizados, estado FROM vendedores")
        for f in cursor.fetchall(): self.tabla_vend.insert("", tk.END, values=f)
    def cargar_vend_campos(self, e):
        sel = self.tabla_vend.selection()
        if sel:
            val = self.tabla_vend.item(sel[0])['values']
            for i, l in enumerate(["Nombre:", "N° Empleado:", "Trabajos:"]):
                self.v_entries[l].delete(0, tk.END)
                self.v_entries[l].insert(0, val[i+1])
    def reg_vend(self):
        v = [self.v_entries[l].get().strip().upper() for l in ["Nombre:", "N° Empleado:", "Trabajos:"]]
        if "" in v: return messagebox.showerror("Error de Datos", "No se permiten espacios en blanco.")
        cursor.execute("INSERT INTO vendedores (nombre, num_empleado, trabajos_realizados, estado) VALUES (?,?,?,'ACTIVO')", (v[0], v[1], v[2]))
        conn.commit(); self.act_tabla_vend()
        for entry in self.v_entries.values(): entry.delete(0, tk.END)
        messagebox.showinfo("Éxito", "Vendedor registrado correctamente.")
    def mod_vend(self):
        sel = self.tabla_vend.selection()
        if not sel: return messagebox.showerror("Error", "Seleccione un vendedor.")
        v = [self.v_entries[l].get().strip().upper() for l in ["Nombre:", "N° Empleado:", "Trabajos:"]]
        if "" in v: return messagebox.showerror("Error de Datos", "No se permiten espacios en blanco.")
        cursor.execute("UPDATE vendedores SET nombre=?, num_empleado=?, trabajos_realizados=? WHERE id=?", (v[0], v[1], v[2], self.tabla_vend.item(sel[0])['values'][0]))
        conn.commit(); self.act_tabla_vend()
        for entry in self.v_entries.values(): entry.delete(0, tk.END)
        messagebox.showinfo("Éxito", "Vendedor modificado correctamente.")
    def alt_estado_vend(self):
        sel = self.tabla_vend.selection()
        if sel:
            id_v = self.tabla_vend.item(sel[0])['values'][0]
            nuevo_est = "INACTIVO" if self.tabla_vend.item(sel[0])['values'][4] == "ACTIVO" else "ACTIVO"
            cursor.execute("UPDATE vendedores SET estado=? WHERE id=?", (nuevo_est, id_v))
            conn.commit(); self.act_tabla_vend()
    def eli_vend(self):
        sel = self.tabla_vend.selection()
        if sel:
            cursor.execute("DELETE FROM vendedores WHERE id=?", (self.tabla_vend.item(sel[0])['values'][0],))
            conn.commit(); self.act_tabla_vend()
            for entry in self.v_entries.values(): entry.delete(0, tk.END)

    # Lógica de Proveedores
    def act_tabla_prov(self):
        for r in self.tabla_prov.get_children(): self.tabla_prov.delete(r)
        cursor.execute("SELECT id, nombre, telefono, empresa, estado FROM proveedores")
        for f in cursor.fetchall(): self.tabla_prov.insert("", tk.END, values=f)
    def cargar_prov_campos(self, e):
        sel = self.tabla_prov.selection()
        if sel:
            val = self.tabla_prov.item(sel[0])['values']
            for i, l in enumerate(["Nombre:", "Teléfono:", "Empresa:"]):
                self.prov_entries[l].delete(0, tk.END)
                self.prov_entries[l].insert(0, val[i+1])
    def reg_prov(self):
        v = [self.prov_entries[l].get().strip().upper() for l in ["Nombre:", "Teléfono:", "Empresa:"]]
        if "" in v: return messagebox.showerror("Error de Datos", "No se permiten espacios en blanco.")
        cursor.execute("INSERT INTO proveedores (nombre, telefono, empresa, estado) VALUES (?,?,?,'ACTIVO')", (v[0], v[1], v[2]))
        conn.commit(); self.act_tabla_prov()
        for entry in self.prov_entries.values(): entry.delete(0, tk.END)
        messagebox.showinfo("Éxito", "Proveedor registrado de manera exitosa.")
    def mod_prov(self):
        sel = self.tabla_prov.selection()
        if not sel: return messagebox.showerror("Error", "Seleccione un proveedor.")
        v = [self.prov_entries[l].get().strip().upper() for l in ["Nombre:", "Teléfono:", "Empresa:"]]
        if "" in v: return messagebox.showerror("Error de Datos", "No se permiten espacios en blanco.")
        cursor.execute("UPDATE proveedores SET nombre=?, telefono=?, empresa=? WHERE id=?", (v[0], v[1], v[2], self.tabla_prov.item(sel[0])['values'][0]))
        conn.commit(); self.act_tabla_prov()
        for entry in self.prov_entries.values(): entry.delete(0, tk.END)
        messagebox.showinfo("Éxito", "Proveedor modificado correctamente.")
    def alt_estado_prov(self):
        sel = self.tabla_prov.selection()
        if sel:
            id_p = self.tabla_prov.item(sel[0])['values'][0]
            nuevo_est = "INACTIVO" if self.tabla_prov.item(sel[0])['values'][4] == "ACTIVO" else "ACTIVO"
            cursor.execute("UPDATE proveedores SET estado=? WHERE id=?", (nuevo_est, id_p))
            conn.commit(); self.act_tabla_prov()
    def eli_prov(self):
        sel = self.tabla_prov.selection()
        if sel:
            cursor.execute("DELETE FROM proveedores WHERE id=?", (self.tabla_prov.item(sel[0])['values'][0],))
            conn.commit(); self.act_tabla_prov()
            for entry in self.prov_entries.values(): entry.delete(0, tk.END)

    # Lógica de Clientes
    def act_tabla_clie(self):
        for r in self.tabla_clie.get_children(): self.tabla_clie.delete(r)
        cursor.execute("SELECT id, nombre, telefono, correo, direccion FROM clientes")
        self.dict_direcciones = {}
        for f in cursor.fetchall():
            self.tabla_clie.insert("", tk.END, values=(f[0], f[1], f[2], f[3]))
            self.dict_direcciones[f[0]] = f[4] if f[4] else "SIN DIRECCIÓN REGISTRADA"
            
    def cargar_clie_campos(self, e):
        sel = self.tabla_clie.selection()
        if sel:
            val = self.tabla_clie.item(sel[0])['values']
            c_id = val[0]
            for i, l in enumerate(["Nombre:", "Teléfono:", "Correo:"]):
                self.c_entries[l].delete(0, tk.END)
                self.c_entries[l].insert(0, val[i+1])
            dir_texto = self.dict_direcciones.get(c_id, "SIN DIRECCIÓN REGISTRADA")
            self.c_entries["Dirección:"].delete(0, tk.END)
            self.c_entries["Dirección:"].insert(0, dir_texto)
            self.lbl_direccion_display.config(text=dir_texto, fg="#002060", font=("Segoe UI", 13, "bold"))
            
    def reg_clie(self):
        v = [self.c_entries[l].get().strip().upper() for l in ["Nombre:", "Teléfono:", "Correo:", "Dirección:"]]
        if "" in v: return messagebox.showerror("Error de Datos", "No se permiten espacios en blanco.")
        cursor.execute("INSERT INTO clientes (nombre, telefono, correo, direccion) VALUES (?,?,?,?)", (v[0], v[1], v[2], v[3]))
        conn.commit(); self.act_tabla_clie()
        for entry in self.c_entries.values(): entry.delete(0, tk.END)
        self.lbl_direccion_display.config(text="SELECCIONE UN CLIENTE\nPARA VER SU DIRECCIÓN", fg="#475569", font=("Segoe UI", 12, "italic"))
        messagebox.showinfo("Éxito", "Cliente registrado correctamente.")
        
    def mod_clie(self):
        sel = self.tabla_clie.selection()
        if not sel: return messagebox.showerror("Error", "Seleccione un cliente de la lista.")
        v = [self.c_entries[l].get().strip().upper() for l in ["Nombre:", "Teléfono:", "Correo:", "Dirección:"]]
        if "" in v: return messagebox.showerror("Error de Datos", "No se permiten espacios en blanco.")
        c_id = self.tabla_clie.item(sel[0])['values'][0]
        cursor.execute("UPDATE clientes SET nombre=?, telefono=?, correo=?, direccion=? WHERE id=?", (v[0], v[1], v[2], v[3], c_id))
        conn.commit(); self.act_tabla_clie()
        for entry in self.c_entries.values(): entry.delete(0, tk.END)
        self.lbl_direccion_display.config(text="SELECCIONE UN CLIENTE\nPARA VER SU DIRECCIÓN", fg="#475569", font=("Segoe UI", 12, "italic"))
        messagebox.showinfo("Éxito", "Cliente modificado correctamente.")
        
    def eli_clie(self):
        sel = self.tabla_clie.selection()
        if sel:
            cursor.execute("DELETE FROM clientes WHERE id=?", (self.tabla_clie.item(sel[0])['values'][0],))
            conn.commit(); self.act_tabla_clie()
            for entry in self.c_entries.values(): entry.delete(0, tk.END)
            self.lbl_direccion_display.config(text="SELECCIONE UN CLIENTE\nPARA VER SU DIRECCIÓN", fg="#475569", font=("Segoe UI", 12, "italic"))
        else: messagebox.showerror("Error", "Seleccione un cliente para eliminar.")

    # Lógica Avanzada del Historial de Despachos
    def actualizar_banner_ultimo_mov(self):
        cursor.execute("""SELECT m.id, p.producto, c.nombre, m.cantidad, m.fecha_salida, m.estado_despacho 
                          FROM movimientos m 
                          LEFT JOIN productos p ON m.producto = p.id 
                          LEFT JOIN clientes c ON m.cliente = c.id 
                          ORDER BY m.id DESC LIMIT 1""")
        ultimo = cursor.fetchone()
        if ultimo:
            texto = f"ID DESP: {ultimo[0]}  |  PRODUCTO: {ultimo[1]}  |  CLIENTE: {ultimo[2]}  |  CANTIDAD: {ultimo[3]}  |  FECHA DESPACHO: {ultimo[4]}  |  ESTADO: {ultimo[5]}"
            self.lbl_ultimo_mov_desc.config(text=texto.upper(), fg="#002060")
        else:
            self.lbl_ultimo_mov_desc.config(text="NINGÚN DESPACHO DETECTADO EN EL HISTORIAL GENERAL", fg="#475569")

    def act_tabla_hist(self):
        for r in self.tabla_hist.get_children(): self.tabla_hist.delete(r)
        cursor.execute("""SELECT m.id, p.producto, v.nombre, c.nombre, m.cantidad, m.fecha_salida, m.estado_despacho, m.producto, m.vendedor, m.cliente
                          FROM movimientos m 
                          LEFT JOIN productos p ON m.producto = p.id 
                          LEFT JOIN vendedores v ON m.vendedor = v.id
                          LEFT JOIN clientes c ON m.cliente = c.id""")
        self.raw_mov_data = {}
        for f in cursor.fetchall():
            p_nom = f[1] if f[1] else "DESCONOCIDO"
            v_nom = f[2] if f[2] else "DESCONOCIDO"
            c_nom = f[3] if f[3] else "DESCONOCIDO"
            est_d = f[6] if f[6] else "POR ENTREGAR"
            self.tabla_hist.insert("", tk.END, values=(f[0], p_nom, v_nom, c_nom, f[4], f[5], est_d))
            self.raw_mov_data[f[0]] = (f[7], f[8], f[9], f[4], est_d)

    def cargar_mov_campos(self, e):
        sel = self.tabla_hist.selection()
        if sel:
            self.h_id_sel = self.tabla_hist.item(sel[0])['values'][0]
            ids = self.raw_mov_data.get(self.h_id_sel)
            if ids:
                self.m_prod.delete(0, tk.END); self.m_prod.insert(0, str(ids[0]))
                self.m_vend.delete(0, tk.END); self.m_vend.insert(0, str(ids[1]))
                self.m_clie.delete(0, tk.END); self.m_clie.insert(0, str(ids[2]))
                self.m_cant.delete(0, tk.END); self.m_cant.insert(0, str(ids[3]))
                self.m_estado.set(ids[4])

    def reg_mov(self):
        p_id, v_id, cl_id, c = self.m_prod.get().strip(), self.m_vend.get().strip(), self.m_clie.get().strip(), self.m_cant.get().strip()
        est = self.m_estado.get()
        if not p_id or not v_id or not cl_id or not c: return messagebox.showerror("Error", "Campos incompletos.")
        cursor.execute("SELECT cantidad FROM productos WHERE id=?", (p_id,))
        p_data = cursor.fetchone()
        if not p_data or p_data[0] < int(c): return messagebox.showerror("Error", "Inventario insuficiente o ID inexistente.")
        cursor.execute("UPDATE productos SET cantidad = cantidad - ? WHERE id = ?", (int(c), p_id))
        cursor.execute("INSERT INTO movimientos (producto, vendedor, cliente, cantidad, fecha_salida, estado_despacho) VALUES (?, ?, ?, ?, ?, ?)", (p_id, v_id, cl_id, int(c), datetime.now().strftime("%d/%m/%Y"), est))
        conn.commit()
        self.m_prod.delete(0, tk.END); self.m_vend.delete(0, tk.END); self.m_clie.delete(0, tk.END); self.m_cant.delete(0, tk.END)
        self.m_estado.set("POR ENTREGAR")
        self.act_tabla_hist(); self.actualizar_banner_ultimo_mov()
        messagebox.showinfo("Éxito", "Despacho registrado con éxito.")

    def mod_mov(self):
        if not self.h_id_sel: return messagebox.showerror("Error", "Seleccione un despacho de la lista.")
        p_id, v_id, cl_id, c = self.m_prod.get().strip(), self.m_vend.get().strip(), self.m_clie.get().strip(), self.m_cant.get().strip()
        est = self.m_estado.get()
        ids_viejos = self.raw_mov_data[self.h_id_sel]
        cursor.execute("UPDATE productos SET cantidad = cantidad + ? WHERE id = ?", (int(ids_viejos[3]), ids_viejos[0]))
        cursor.execute("UPDATE movimientos SET producto=?, vendedor=?, cliente=?, cantidad=?, estado_despacho=? WHERE id=?", (p_id, v_id, cl_id, int(c), est, self.h_id_sel))
        cursor.execute("UPDATE productos SET cantidad = cantidad - ? WHERE id = ?", (int(c), p_id))
        conn.commit()
        self.m_prod.delete(0, tk.END); self.m_vend.delete(0, tk.END); self.m_clie.delete(0, tk.END); self.m_cant.delete(0, tk.END)
        self.m_estado.set("POR ENTREGAR")
        self.h_id_sel = None
        self.act_tabla_hist(); self.actualizar_banner_ultimo_mov()
        messagebox.showinfo("Éxito", "Despacho modificado con éxito.")

    def eli_mov(self):
        if not self.h_id_sel: return messagebox.showerror("Error", "Seleccione un registro.")
        cursor.execute("DELETE FROM movimientos WHERE id=?", (self.h_id_sel,))
        conn.commit()
        self.m_prod.delete(0, tk.END); self.m_vend.delete(0, tk.END); self.m_clie.delete(0, tk.END); self.m_cant.delete(0, tk.END)
        self.m_estado.set("POR ENTREGAR")
        self.h_id_sel = None
        self.act_tabla_hist(); self.actualizar_banner_ultimo_mov()
        messagebox.showinfo("Éxito", "Despacho eliminado.")

if __name__ == "__main__":
    ctk.set_appearance_mode("Light")
    root = ctk.CTk()
    app = SISARADApp(root)
    root.mainloop()