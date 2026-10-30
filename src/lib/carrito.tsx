import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import type { LineaCarrito } from '../types'
import { guardar, leer } from './almacen'
import { precioVigente } from './pedido'

const CLAVE = 'menu-qr:carrito'
export const CANTIDAD_MAXIMA = 20

type Accion =
  | { tipo: 'agregar'; productoId: string; tamano: string; cantidad: number; nota: string }
  | { tipo: 'cantidad'; id: string; cantidad: number }
  | { tipo: 'quitar'; id: string }
  | { tipo: 'vaciar' }

const limitar = (cantidad: number) => Math.min(Math.max(cantidad, 1), CANTIDAD_MAXIMA)

function reductor(lineas: LineaCarrito[], accion: Accion): LineaCarrito[] {
  switch (accion.tipo) {
    case 'agregar': {
      const nota = accion.nota.trim()
      const id = `${accion.productoId}|${accion.tamano}|${nota}`
      const existente = lineas.find((l) => l.id === id)
      if (existente) {
        return lineas.map((l) => (l.id === id ? { ...l, cantidad: limitar(l.cantidad + accion.cantidad) } : l))
      }
      const nueva = { id, productoId: accion.productoId, tamano: accion.tamano, nota, cantidad: limitar(accion.cantidad) }
      return [...lineas, nueva]
    }
    case 'cantidad':
      return lineas.map((l) => (l.id === accion.id ? { ...l, cantidad: limitar(accion.cantidad) } : l))
    case 'quitar':
      return lineas.filter((l) => l.id !== accion.id)
    case 'vaciar':
      return []
  }
}

/** Carrito guardado de una visita anterior, sin productos que ya no existan o estén agotados. */
function cargarGuardado(): LineaCarrito[] {
  const guardado = leer<LineaCarrito[]>(CLAVE)
  if (!Array.isArray(guardado)) return []
  return guardado.filter((l) => precioVigente(l.productoId, l.tamano) !== null)
}

interface ContextoCarrito {
  lineas: LineaCarrito[]
  totalArticulos: number
  agregar: (productoId: string, tamano: string, cantidad: number, nota: string) => void
  cambiarCantidad: (id: string, cantidad: number) => void
  quitar: (id: string) => void
  vaciar: () => void
}

const Contexto = createContext<ContextoCarrito | null>(null)

export function ProveedorCarrito({ children }: { children: ReactNode }) {
  const [lineas, despachar] = useReducer(reductor, undefined, cargarGuardado)

  useEffect(() => guardar(CLAVE, lineas), [lineas])

  const valor = useMemo<ContextoCarrito>(
    () => ({
      lineas,
      totalArticulos: lineas.reduce((suma, l) => suma + l.cantidad, 0),
      agregar: (productoId, tamano, cantidad, nota) => despachar({ tipo: 'agregar', productoId, tamano, cantidad, nota }),
      cambiarCantidad: (id, cantidad) => despachar({ tipo: 'cantidad', id, cantidad }),
      quitar: (id) => despachar({ tipo: 'quitar', id }),
      vaciar: () => despachar({ tipo: 'vaciar' }),
    }),
    [lineas],
  )

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useCarrito(): ContextoCarrito {
  const contexto = useContext(Contexto)
  if (!contexto) throw new Error('useCarrito debe usarse dentro de <ProveedorCarrito>')
  return contexto
}
