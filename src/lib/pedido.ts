import { menu, negocio } from '../data'
import type { DatosCliente, LineaCarrito, Producto, TipoPedido } from '../types'

const productos = new Map(menu.categorias.flatMap((c) => c.productos.map((p) => [p.id, p] as const)))

export function buscarProducto(id: string): Producto | undefined {
  return productos.get(id)
}

/** Precio vigente de un producto en un tamaño; null si ya no existe o está agotado. */
export function precioVigente(productoId: string, tamano: string): number | null {
  const producto = productos.get(productoId)
  if (!producto?.disponible) return null
  return producto.tamanos.find((t) => t.nombre === tamano)?.precio ?? null
}

export interface LineaResuelta extends LineaCarrito {
  producto: Producto
  precioUnitario: number
  importe: number
}

/** Une cada línea con el menú vigente. Las que ya no se pueden pedir se descartan. */
export function resolverLineas(lineas: LineaCarrito[]): LineaResuelta[] {
  return lineas.flatMap((linea) => {
    const producto = productos.get(linea.productoId)
    const precio = precioVigente(linea.productoId, linea.tamano)
    if (!producto || precio === null) return []
    return [{ ...linea, producto, precioUnitario: precio, importe: precio * linea.cantidad }]
  })
}

export function calcularTotales(lineas: LineaResuelta[], tipo: TipoPedido) {
  const subtotal = lineas.reduce((suma, linea) => suma + linea.importe, 0)
  const envio = tipo === 'domicilio' ? negocio.costoEnvio : 0
  return { subtotal, envio, total: subtotal + envio }
}

export type ErroresCliente = Partial<Record<keyof DatosCliente, string>>

export function validarCliente(tipo: TipoPedido, datos: DatosCliente): ErroresCliente {
  if (tipo === 'mesa') return {}
  const errores: ErroresCliente = {}
  if (!datos.nombre.trim()) errores.nombre = 'Escribe tu nombre.'
  if (datos.telefono.replace(/\D/g, '').length !== 10) errores.telefono = 'Escribe un teléfono de 10 dígitos.'
  if (tipo === 'domicilio' && !datos.direccion.trim()) errores.direccion = 'Escribe la dirección de entrega.'
  return errores
}

export const NOMBRE_TIPO: Record<TipoPedido, string> = {
  mesa: 'En mesa',
  recoger: 'Para recoger',
  domicilio: 'A domicilio',
}
