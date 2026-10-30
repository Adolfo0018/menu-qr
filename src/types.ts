export interface Negocio {
  nombre: string
  eslogan: string
  /** Ruta dentro de /public, por ejemplo "/img/logo.png". Vacío = se muestran las iniciales. */
  logo: string
  /** URL pública del menú; se usa para generar el QR. Vacío = la URL desde donde se abre. */
  urlPublica: string
  moneda: string
  /** Costo fijo que se suma a los pedidos a domicilio. */
  costoEnvio: number
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

export interface Mesa {
  numero: number
  /** Código difícil de adivinar que va en el QR de la mesa (?m=codigo). */
  codigo: string
}

export type TipoPedido = 'mesa' | 'recoger' | 'domicilio'

export interface LineaCarrito {
  /** productoId|tamano|nota: dos líneas iguales se juntan en una. */
  id: string
  productoId: string
  tamano: string
  cantidad: number
  nota: string
}

export interface DatosCliente {
  nombre: string
  telefono: string
  direccion: string
  referencias: string
}
