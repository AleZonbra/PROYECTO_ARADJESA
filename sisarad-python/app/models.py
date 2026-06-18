from sqlalchemy import Boolean, Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(String, primary_key=True)
    usuario = Column(String, unique=True, nullable=False)
    nombre = Column(String, nullable=False)
    clave = Column(String, nullable=False)
    role = Column(String, default="administrador")
    activo = Column(Boolean, default=True)


class Producto(Base):
    __tablename__ = "productos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    producto = Column(String, nullable=False)
    serial_lote = Column(String, nullable=False)
    cantidad = Column(Integer, default=0)
    fecha_produccion = Column(String)
    fecha_expiracion = Column(String)

    movimientos = relationship("Movimiento", back_populates="producto_rel")


class Vendedor(Base):
    __tablename__ = "vendedores"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String, nullable=False)
    num_empleado = Column(String, nullable=False)
    trabajos_realizados = Column(String)
    estado = Column(String, default="ACTIVO")

    movimientos = relationship("Movimiento", back_populates="vendedor_rel")


class Proveedor(Base):
    __tablename__ = "proveedores"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String, nullable=False)
    telefono = Column(String, nullable=False)
    empresa = Column(String, nullable=False)
    estado = Column(String, default="ACTIVO")


class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String, nullable=False)
    telefono = Column(String, nullable=False)
    correo = Column(String, nullable=False)
    direccion = Column(String, nullable=False)

    movimientos = relationship("Movimiento", back_populates="cliente_rel")


class Movimiento(Base):
    __tablename__ = "movimientos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=False)
    vendedor_id = Column(Integer, ForeignKey("vendedores.id"), nullable=False)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=False)
    cantidad = Column(Integer, nullable=False)
    fecha_salida = Column(String, nullable=False)
    estado_despacho = Column(String, default="POR ENTREGAR")

    producto_rel = relationship("Producto", back_populates="movimientos")
    vendedor_rel = relationship("Vendedor", back_populates="movimientos")
    cliente_rel = relationship("Cliente", back_populates="movimientos")
