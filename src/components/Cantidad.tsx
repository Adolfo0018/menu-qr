import { CANTIDAD_MAXIMA } from '../lib/carrito'

interface Props {
  valor: number
  onCambiar: (valor: number) => void
  etiqueta: string
}

export function Cantidad({ valor, onCambiar, etiqueta }: Props) {
  return (
    <div className="cantidad" role="group" aria-label={etiqueta}>
      <button type="button" aria-label="Uno menos" disabled={valor <= 1} onClick={() => onCambiar(valor - 1)}>
        −
      </button>
      <span aria-live="polite">{valor}</span>
      <button
        type="button"
        aria-label="Uno más"
        disabled={valor >= CANTIDAD_MAXIMA}
        onClick={() => onCambiar(valor + 1)}
      >
        +
      </button>
    </div>
  )
}
