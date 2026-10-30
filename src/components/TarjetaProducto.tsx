import { formatearPrecio } from '../lib/formato'
import type { Producto } from '../types'

interface Props {
  producto: Producto
  icono: string
}

export function TarjetaProducto({ producto, icono }: Props) {
  const agotado = !producto.disponible

  return (
    <article className={`producto${agotado ? ' producto-agotado' : ''}`}>
      <div className="producto-foto">
        {producto.foto ? (
          <img src={producto.foto} alt="" loading="lazy" />
        ) : (
          <span aria-hidden="true">{icono}</span>
        )}
      </div>
      <div className="producto-info">
        <div className="producto-cabecera">
          <h3 className="producto-nombre">{producto.nombre}</h3>
          {agotado && <span className="insignia insignia-agotado">Agotado</span>}
          {producto.etiquetas.map((etiqueta) => (
            <span key={etiqueta} className="insignia">
              {etiqueta}
            </span>
          ))}
        </div>
        {producto.descripcion && <p className="producto-descripcion">{producto.descripcion}</p>}
        <ul className="tamanos" aria-label="Precios">
          {producto.tamanos.map((tamano) => (
            <li key={tamano.nombre || 'unico'} className="tamano">
              {tamano.nombre && <span className="tamano-nombre">{tamano.nombre}</span>}
              <span className="tamano-precio">{formatearPrecio(tamano.precio)}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}
