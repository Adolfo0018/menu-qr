import { negocio } from '../data'

const formatoMoneda = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: negocio.moneda,
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

export function formatearPrecio(valor: number): string {
  return formatoMoneda.format(valor)
}

export function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter((palabra) => /^[\p{L}\p{N}]/u.test(palabra))
    .slice(0, 2)
    .map((palabra) => palabra[0].toUpperCase())
    .join('')
}

/** URL pública del menú: base de los QR de mesa y enlace para pedidos de fuera. */
export function urlDelMenu(): string {
  return negocio.urlPublica || window.location.origin
}
