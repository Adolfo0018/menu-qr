import { useEffect, useRef } from 'react'
import type { Categoria } from '../types'

interface Props {
  categorias: Categoria[]
  activa: string
  onElegir: (id: string) => void
}

export function NavCategorias({ categorias, activa, onElegir }: Props) {
  const contenedor = useRef<HTMLDivElement>(null)

  // Mantiene visible el botón activo cuando hay más categorías de las que caben.
  useEffect(() => {
    const barra = contenedor.current
    const boton = barra?.querySelector<HTMLButtonElement>(`[data-id="${activa}"]`)
    if (!barra || !boton) return
    const izquierda = boton.offsetLeft - (barra.clientWidth - boton.clientWidth) / 2
    barra.scrollTo({ left: izquierda, behavior: 'smooth' })
  }, [activa])

  return (
    <nav className="nav-categorias" aria-label="Categorías del menú">
      <div className="nav-categorias-lista" ref={contenedor}>
        {categorias.map((categoria) => (
          <button
            key={categoria.id}
            type="button"
            data-id={categoria.id}
            className={`chip${categoria.id === activa ? ' chip-activo' : ''}`}
            aria-current={categoria.id === activa ? 'true' : undefined}
            onClick={() => onElegir(categoria.id)}
          >
            <span aria-hidden="true">{categoria.icono}</span> {categoria.nombre}
          </button>
        ))}
      </div>
    </nav>
  )
}
