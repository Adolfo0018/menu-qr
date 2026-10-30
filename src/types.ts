export interface Negocio {
  nombre: string
  eslogan: string
  /** Ruta dentro de /public, por ejemplo "/img/logo.png". Vacío = se muestran las iniciales. */
  logo: string
  /** URL pública del menú; se usa para generar el QR. Vacío = la URL desde donde se abre. */
  urlPublica: string
  moneda: string
  horario: string
  direccion: string
  telefono: string
  instagram: string
  facebook: string
  colores: {
    primario: string
    textoSobrePrimario: string
    acento: string
    fondo: string
    superficie: string
    texto: string
    textoSuave: string
  }
}

export interface Tamano {
  /** Vacío cuando el producto tiene un solo precio. */
  nombre: string
  precio: number
}

export interface Producto {
  id: string
  nombre: string
  descripcion: string
  /** Ruta dentro de /public, por ejemplo "/img/productos/frappe-moka.jpg". Vacío = icono de la categoría. */
  foto: string
  etiquetas: string[]
  disponible: boolean
  tamanos: Tamano[]
}

export interface Categoria {
  id: string
  nombre: string
  icono: string
  productos: Producto[]
}

export interface Menu {
  categorias: Categoria[]
}
