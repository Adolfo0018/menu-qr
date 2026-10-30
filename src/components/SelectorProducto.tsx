import { useState, type FormEvent } from 'react'
import { useCarrito } from '../lib/carrito'
import { formatearPrecio } from '../lib/formato'
import type { Producto } from '../types'
import { Cantidad } from './Cantidad'
import { BotonCerrar, Dialogo } from './Dialogo'

const LARGO_NOTA = 120

interface Props {
  producto: Producto | null
  onCerrar: () => void
}

export function SelectorProducto({ producto, onCerrar }: Props) {
  return (
    <Dialogo abierto={producto !== null} onCerrar={onCerrar} titulo={producto?.nombre ?? ''} variante="hoja">
      {producto && <Formulario key={producto.id} producto={producto} onCerrar={onCerrar} />}
    </Dialogo>
  )
}

function Formulario({ producto, onCerrar }: { producto: Producto; onCerrar: () => void }) {
  const { agregar } = useCarrito()
  const [tamano, setTamano] = useState(producto.tamanos[0].nombre)
  const [cantidad, setCantidad] = useState(1)
  const [nota, setNota] = useState('')
  const precio = producto.tamanos.find((t) => t.nombre === tamano)?.precio ?? 0

  function enviar(e: FormEvent) {
    e.preventDefault()
    agregar(producto.id, tamano, cantidad, nota)
    onCerrar()
  }

  return (
    <form className="selector" onSubmit={enviar}>
      <div className="dialogo-encabezado">
        <div>
          <h2>{producto.nombre}</h2>
          {producto.descripcion && <p className="texto-suave">{producto.descripcion}</p>}
        </div>
        <BotonCerrar onClick={onCerrar} />
      </div>

      {producto.tamanos.length > 1 && (
        <fieldset className="opciones">
          <legend>Tamaño</legend>
          {producto.tamanos.map((t) => (
            <label key={t.nombre} className="opcion">
              <input
                type="radio"
                name="tamano"
                value={t.nombre}
                checked={tamano === t.nombre}
                onChange={() => setTamano(t.nombre)}
              />
              <span className="opcion-texto">{t.nombre}</span>
              <span className="opcion-precio">{formatearPrecio(t.precio)}</span>
            </label>
          ))}
        </fieldset>
      )}

      <div className="selector-fila">
        <span className="etiqueta">Cantidad</span>
        <Cantidad valor={cantidad} onCambiar={setCantidad} etiqueta="Cantidad" />
      </div>

      <label className="campo">
        <span>
          Nota <span className="texto-suave">(opcional)</span>
        </span>
        <textarea
          rows={2}
          maxLength={LARGO_NOTA}
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          placeholder="Ej. sin hielo, poca azúcar"
        />
      </label>

      <button type="submit" className="boton boton-ancho">
        Agregar · {formatearPrecio(precio * cantidad)}
      </button>
    </form>
  )
}
