import { useCarrito } from '../lib/carrito'
import { formatearPrecio } from '../lib/formato'
import { calcularTotales, resolverLineas } from '../lib/pedido'

export function BarraCarrito({ onAbrir }: { onAbrir: () => void }) {
  const { lineas, totalArticulos } = useCarrito()
  if (lineas.length === 0) return null

  const { subtotal } = calcularTotales(resolverLineas(lineas), 'mesa')

  return (
    <div className="barra-carrito">
      <button type="button" className="boton boton-ancho barra-carrito-boton" onClick={onAbrir}>
        <span className="barra-carrito-cantidad">{totalArticulos}</span>
        <span>Ver mi pedido</span>
        <span>{formatearPrecio(subtotal)}</span>
      </button>
    </div>
  )
}
