import { mesas } from '../data'
import type { Mesa } from '../types'
import { borrar, guardar, leer } from './almacen'

const CLAVE = 'menu-qr:mesa'

export interface EstadoMesa {
  mesa: Mesa | null
  /** El QR traía un código que no corresponde a ninguna mesa vigente. */
  codigoInvalido: boolean
}

/**
 * Lee la mesa del parámetro ?m= del QR. Se recuerda durante la visita (sessionStorage)
 * para que no se pierda si el cliente recarga o navega.
 */
export function detectarMesa(): EstadoMesa {
  const codigo = new URLSearchParams(window.location.search).get('m')

  if (codigo !== null) {
    const mesa = mesas.find((m) => m.codigo === codigo) ?? null
    if (mesa) guardar(CLAVE, mesa.codigo, 'session')
    else borrar(CLAVE, 'session')
    return { mesa, codigoInvalido: !mesa }
  }

  const guardado = leer<string>(CLAVE, 'session')
  return { mesa: mesas.find((m) => m.codigo === guardado) ?? null, codigoInvalido: false }
}
