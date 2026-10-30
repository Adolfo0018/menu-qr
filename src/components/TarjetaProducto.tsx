import { formatearPrecio } from '../lib/formato'
import type { Producto } from '../types'

interface Props {
  producto: Producto
  icono: string
  onAgregar: (producto: Producto) => void
}

export function TarjetaProducto({ producto, icono, onAgregar }: Props) {
  const agotado = !producto.disponible

  return (
    <article className={`producto${agotado ? ' producto-agotado' : ''}`}>
      <div className="producto-foto">
        {producto.foto ? (
          <img src={producto.foto} alt="" loading="lazy" />
        ) : (
          <span aria-hidden="true">{icono}</span>
        )}
        {agotado && <span className="producto-sello">Agotado</span>}
      </div>
      <div className="producto-info">
        <div className="producto-cabecera">
          <h3 className="producto-nombre">{producto.nombre}</h3>
          {producto.etiquetas.map((etiqueta) => (
            <span key={etiqueta} className={`insignia insignia-${etiqueta.toLowerCase()}`}>
              {etiqueta}
            </span>
          ))}
        </div>
        {producto.descripcion && <p className="producto-descripcion">{producto.descripcion}</p>}
        <div className="producto-pie">
          <ul className="tamanos" aria-label="Precios">
            {producto.tamanos.map((tamano) => (
              <li key={tamano.nombre || 'unico'} className="tamano">
                {tamano.nombre && <span className="tamano-nombre">{tamano.nombre}</span>}
                <span className="tamano-precio">{formatearPrecio(tamano.precio)}</span>
              </li>
            ))}
          </ul>
          {!agotado && (
            <button
              type="button"
              className="boton-agregar"
              onClick={() => onAgregar(producto)}
              aria-label={`Agregar ${producto.nombre}`}
            >
              <span aria-hidden="true">+</span>
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
