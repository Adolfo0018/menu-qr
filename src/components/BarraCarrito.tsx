import { useCarrito } from '../lib/carrito'
import { formatearPrecio } from '../lib/formato'
import { calcularTotales, resolverLineas } from '../lib/pedido'

export function BarraCarrito({ onAbrir }: { onAbrir: () => void }) {
  const { lineas, totalArticulos } = useCarrito()
  if (lineas.length === 0) return null

  const { subtotal } = calcularTotales(resolverLineas(lineas), 'mesa')

  return (
    <div className="barra-carrito">
      <button type="button" className="barra-carrito-boton" onClick={onAbrir}>
        {/* La key reinicia la animación cada vez que cambia la cantidad. */}
        <span key={totalArticulos} className="barra-carrito-cantidad">
          {totalArticulos}
        </span>
        <span className="barra-carrito-texto">Ver mi pedido</span>
        <span className="barra-carrito-total">{formatearPrecio(subtotal)}</span>
      </button>
    </div>
  )
}
