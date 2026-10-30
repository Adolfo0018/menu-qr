import { useEffect, useState, type FormEvent } from 'react'
import { negocio } from '../data'
import { guardar, leer } from '../lib/almacen'
import { useCarrito } from '../lib/carrito'
import { formatearPrecio } from '../lib/formato'
import {
  calcularTotales,
  NOMBRE_TIPO,
  referenciaCorta,
  resolverLineas,
  validarCliente,
  type ErroresCliente,
  type LineaResuelta,
} from '../lib/pedido'
import type { DatosCliente, Mesa, TipoPedido } from '../types'
import { Cantidad } from './Cantidad'
import { BotonCerrar, Dialogo } from './Dialogo'

const CLAVE_CLIENTE = 'menu-qr:cliente'
const CLIENTE_VACIO: DatosCliente = { nombre: '', telefono: '', direccion: '', referencias: '' }
const TIPOS_EXTERNOS: TipoPedido[] = ['recoger', 'domicilio']
const PAGO: Record<TipoPedido, string> = {
  mesa: 'Pagas en caja.',
  recoger: 'Pagas en caja al recogerlo.',
  domicilio: 'Pagas al recibir tu pedido.',
}

interface Props {
  abierto: boolean
  onCerrar: () => void
  mesa: Mesa | null
}

export function PanelCarrito({ abierto, onCerrar, mesa }: Props) {
  return (
    <Dialogo abierto={abierto} onCerrar={onCerrar} titulo="Tu pedido" variante="panel">
      <Contenido onCerrar={onCerrar} mesa={mesa} />
    </Dialogo>
  )
}

function Contenido({ onCerrar, mesa }: Omit<Props, 'abierto'>) {
  const { lineas: lineasCarrito, cambiarCantidad, quitar, vaciar } = useCarrito()
  const [paso, setPaso] = useState<'carrito' | 'resumen' | 'enviado'>('carrito')
  const [enviando, setEnviando] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState('')
  const [referencia, setReferencia] = useState('')
  const [tipo, setTipo] = useState<TipoPedido>(mesa ? 'mesa' : 'recoger')
  const [cliente, setCliente] = useState<DatosCliente>(() => ({ ...CLIENTE_VACIO, ...leer<Partial<DatosCliente>>(CLAVE_CLIENTE) }))
  const [errores, setErrores] = useState<ErroresCliente>({})

  // Se recuerdan nombre, teléfono y dirección para el siguiente pedido en este celular.
  useEffect(() => guardar(CLAVE_CLIENTE, cliente), [cliente])

  const lineas = resolverLineas(lineasCarrito)
  const totales = calcularTotales(lineas, tipo)

  function cambiarCampo(campo: keyof DatosCliente, valor: string) {
    setCliente((actual) => ({ ...actual, [campo]: valor }))
    setErrores((actuales) => ({ ...actuales, [campo]: undefined }))
  }

  function revisar(e: FormEvent) {
    e.preventDefault()
    const encontrados = validarCliente(tipo, cliente)
    setErrores(encontrados)
    if (Object.keys(encontrados).length === 0) setPaso('resumen')
  }

  async function enviar() {
    setEnviando(true)
    setErrorEnvio('')
    try {
      const { enviarPedido } = await import('../lib/enviarPedido')
      const id = await enviarPedido({ tipo, mesa, cliente, lineas })
      setReferencia(referenciaCorta(id))
      setPaso('enviado')
      vaciar()
    } catch {
      setErrorEnvio('No se pudo enviar tu pedido. Revisa tu conexión e intenta de nuevo, o pide directamente en caja.')
    } finally {
      setEnviando(false)
    }
  }

  if (paso === 'enviado') {
    return <Confirmacion tipo={tipo} mesa={mesa} cliente={cliente} referencia={referencia} onCerrar={onCerrar} />
  }

  if (lineas.length === 0) {
    return (
      <div className="panel-vacio">
        <div className="dialogo-encabezado">
          <h2>Tu pedido</h2>
          <BotonCerrar onClick={onCerrar} />
        </div>
        <p className="texto-suave">Todavía no agregas nada.</p>
        <button type="button" className="boton" onClick={onCerrar}>
          Ver el menú
        </button>
      </div>
    )
  }

  if (paso === 'resumen') {
    return (
      <Resumen
        tipo={tipo}
        mesa={mesa}
        cliente={cliente}
        lineas={lineas}
        totales={totales}
        enviando={enviando}
        error={errorEnvio}
        onEnviar={enviar}
        onEditar={() => setPaso('carrito')}
        onCerrar={onCerrar}
      />
    )
  }

  return (
    <form className="panel" onSubmit={revisar} noValidate>
      <div className="dialogo-encabezado">
        <h2>Tu pedido</h2>
        <BotonCerrar onClick={onCerrar} />
      </div>

      <ul className="lineas">
        {lineas.map((linea) => (
          <li key={linea.id} className="linea">
            <div className="linea-info">
              <p className="linea-nombre">
                {linea.producto.nombre}
                {linea.tamano && <span className="texto-suave"> · {linea.tamano}</span>}
              </p>
              {linea.nota && <p className="linea-nota">“{linea.nota}”</p>}
              <button type="button" className="boton-texto" onClick={() => quitar(linea.id)}>
                Quitar
              </button>
            </div>
            <div className="linea-lado">
              <span className="linea-importe">{formatearPrecio(linea.importe)}</span>
              <Cantidad
                valor={linea.cantidad}
                onCambiar={(cantidad) => cambiarCantidad(linea.id, cantidad)}
                etiqueta={`Cantidad de ${linea.producto.nombre}`}
              />
            </div>
          </li>
        ))}
      </ul>

      {/* Con QR de mesa el cliente está en el local: no elige, el pedido es para su mesa. */}
      {mesa ? (
        <p className="resumen-bloque resumen-tipo">📍 Pedido para la mesa {mesa.numero}</p>
      ) : (
        <fieldset className="opciones">
          <legend>¿Cómo lo quieres?</legend>
          {TIPOS_EXTERNOS.map((t) => (
            <label key={t} className="opcion">
              <input type="radio" name="tipo" value={t} checked={tipo === t} onChange={() => setTipo(t)} />
              <span className="opcion-texto">{NOMBRE_TIPO[t]}</span>
              {t === 'domicilio' && negocio.costoEnvio > 0 && (
                <span className="opcion-precio">+{formatearPrecio(negocio.costoEnvio)} envío</span>
              )}
            </label>
          ))}
        </fieldset>
      )}

      {tipo !== 'mesa' && (
        <div className="campos">
          <Campo
            etiqueta="Nombre"
            valor={cliente.nombre}
            error={errores.nombre}
            onCambiar={(v) => cambiarCampo('nombre', v)}
            autoComplete="name"
          />
          <Campo
            etiqueta="Teléfono"
            valor={cliente.telefono}
            error={errores.telefono}
            onCambiar={(v) => cambiarCampo('telefono', v)}
            autoComplete="tel"
            tipo="tel"
            inputMode="tel"
            ayuda="Te llamaremos para confirmar tu pedido."
          />
          {tipo === 'domicilio' && (
            <>
              <Campo
                etiqueta="Dirección"
                valor={cliente.direccion}
                error={errores.direccion}
                onCambiar={(v) => cambiarCampo('direccion', v)}
                autoComplete="street-address"
                placeholder="Calle, número y colonia"
              />
              <Campo
                etiqueta="Referencias"
                opcional
                valor={cliente.referencias}
                onCambiar={(v) => cambiarCampo('referencias', v)}
                placeholder="Ej. casa azul, portón negro"
              />
            </>
          )}
        </div>
      )}

      <Totales {...totales} />

      <button type="submit" className="boton boton-ancho">
        Revisar pedido
      </button>
    </form>
  )
}

interface PropsCampo {
  etiqueta: string
  valor: string
  onCambiar: (valor: string) => void
  error?: string
  opcional?: boolean
  tipo?: 'text' | 'tel'
  inputMode?: 'text' | 'tel'
  autoComplete?: string
  placeholder?: string
  ayuda?: string
}

function Campo({ etiqueta, valor, onCambiar, error, opcional, tipo = 'text', inputMode, autoComplete, placeholder, ayuda }: PropsCampo) {
  return (
    <label className="campo">
      <span>
        {etiqueta} {opcional && <span className="texto-suave">(opcional)</span>}
      </span>
      <input
        type={tipo}
        inputMode={inputMode}
        value={valor}
        onChange={(e) => onCambiar(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        maxLength={150}
      />
      {error ? <span className="campo-error">{error}</span> : ayuda && <span className="campo-ayuda">{ayuda}</span>}
    </label>
  )
}

function Totales({ subtotal, envio, total }: { subtotal: number; envio: number; total: number }) {
  return (
    <dl className="totales">
      {envio > 0 && (
        <>
          <dt>Subtotal</dt>
          <dd>{formatearPrecio(subtotal)}</dd>
          <dt>Envío</dt>
          <dd>{formatearPrecio(envio)}</dd>
        </>
      )}
      <dt className="totales-total">Total</dt>
      <dd className="totales-total">{formatearPrecio(total)}</dd>
    </dl>
  )
}

interface PropsResumen {
  tipo: TipoPedido
  mesa: Mesa | null
  cliente: DatosCliente
  lineas: LineaResuelta[]
  totales: { subtotal: number; envio: number; total: number }
  enviando: boolean
  error: string
  onEnviar: () => void
  onEditar: () => void
  onCerrar: () => void
}

function Resumen({ tipo, mesa, cliente, lineas, totales, enviando, error, onEnviar, onEditar, onCerrar }: PropsResumen) {
  return (
    <div className="panel">
      <div className="dialogo-encabezado">
        <h2>Revisa tu pedido</h2>
        <BotonCerrar onClick={onCerrar} />
      </div>

      <section className="resumen-bloque">
        <p className="resumen-tipo">{tipo === 'mesa' && mesa ? `Mesa ${mesa.numero}` : NOMBRE_TIPO[tipo]}</p>
        {tipo !== 'mesa' && (
          <p>
            {cliente.nombre.trim()} · {cliente.telefono.trim()}
          </p>
        )}
        {tipo === 'domicilio' && (
          <p>
            {cliente.direccion.trim()}
            {cliente.referencias.trim() && <span className="texto-suave"> ({cliente.referencias.trim()})</span>}
          </p>
        )}
      </section>

      <ul className="lineas lineas-resumen">
        {lineas.map((linea) => (
          <li key={linea.id} className="linea">
            <div className="linea-info">
              <p className="linea-nombre">
                {linea.cantidad} × {linea.producto.nombre}
                {linea.tamano && <span className="texto-suave"> · {linea.tamano}</span>}
              </p>
              {linea.nota && <p className="linea-nota">“{linea.nota}”</p>}
            </div>
            <span className="linea-importe">{formatearPrecio(linea.importe)}</span>
          </li>
        ))}
      </ul>

      <Totales {...totales} />

      <div className="aviso">
        {tipo !== 'mesa' && <p>Te llamaremos al {cliente.telefono.trim()} para confirmar tu pedido.</p>}
        <p>{PAGO[tipo]}</p>
      </div>

      {error && (
        <p className="aviso aviso-error" role="alert">
          {error}
        </p>
      )}

      <div className="resumen-acciones">
        <button type="button" className="boton boton-secundario" onClick={onEditar} disabled={enviando}>
          Editar pedido
        </button>
        <button type="button" className="boton" onClick={onEnviar} disabled={enviando}>
          {enviando ? 'Enviando…' : 'Enviar pedido'}
        </button>
      </div>
    </div>
  )
}

interface PropsConfirmacion {
  tipo: TipoPedido
  mesa: Mesa | null
  cliente: DatosCliente
  referencia: string
  onCerrar: () => void
}

function Confirmacion({ tipo, mesa, cliente, referencia, onCerrar }: PropsConfirmacion) {
  return (
    <div className="panel confirmacion">
      <p className="confirmacion-icono" aria-hidden="true">
        ✅
      </p>
      <h2>¡Pedido enviado!</h2>
      <p className="confirmacion-referencia">
        Referencia <strong>{referencia}</strong>
      </p>
      <div className="aviso">
        {tipo === 'mesa' && mesa && <p>Lo estamos preparando y te lo llevamos a la mesa {mesa.numero}.</p>}
        {tipo !== 'mesa' && <p>Te llamaremos al {cliente.telefono.trim()} para confirmar tu pedido.</p>}
        <p>{PAGO[tipo]}</p>
      </div>
      <button type="button" className="boton boton-ancho" onClick={onCerrar}>
        Volver al menú
      </button>
    </div>
  )
}
