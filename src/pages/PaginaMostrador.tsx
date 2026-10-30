import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth'
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { mesas, negocio } from '../data'
import { activarAudio, audioActivo, mantenerPantallaEncendida, sonarAviso } from '../lib/avisos'
import { auth, db } from '../lib/firebase'
import { formatearPrecio, iniciales } from '../lib/formato'
import { NOMBRE_TIPO, precioDeLista, referenciaCorta } from '../lib/pedido'
import type { EstadoPedido, Pedido, TipoPedido } from '../types'

const ESTADOS_ACTIVOS: EstadoPedido[] = ['nuevo', 'en_preparacion']
const RECORDATORIO_MS = 20_000
const ICONO_TIPO: Record<TipoPedido, string> = { mesa: '📍', recoger: '🛍️', domicilio: '🛵' }
const MOTIVOS_RECHAZO = [
  'No contestó la llamada',
  'Pedido falso o duplicado',
  'Producto agotado',
  'Fuera de la zona de entrega',
  'Otro motivo',
]

type Sesion = { estado: 'cargando' } | { estado: 'fuera' } | { estado: 'sin-acceso'; usuario: User } | { estado: 'dentro'; usuario: User }

export function PaginaMostrador() {
  const [sesion, setSesion] = useState<Sesion>({ estado: 'cargando' })

  useEffect(() => {
    document.title = `${negocio.nombre} · Mostrador`
    return onAuthStateChanged(auth, async (usuario) => {
      if (!usuario) return setSesion({ estado: 'fuera' })
      // Solo entran las cuentas dadas de alta en la colección "personal" (ver README).
      try {
        const ficha = await getDoc(doc(db, 'personal', usuario.uid))
        setSesion(ficha.exists() ? { estado: 'dentro', usuario } : { estado: 'sin-acceso', usuario })
      } catch {
        setSesion({ estado: 'sin-acceso', usuario })
      }
    })
  }, [])

  if (sesion.estado === 'cargando') {
    return (
      <Acceso>
        <span className="cargando cargando-grande" aria-label="Cargando" />
      </Acceso>
    )
  }
  if (sesion.estado === 'fuera') return <InicioSesion />
  if (sesion.estado === 'sin-acceso') {
    return (
      <Acceso>
        <h2>Sin acceso</h2>
        <p className="texto-suave">
          La cuenta <strong>{sesion.usuario.email}</strong> no está dada de alta como personal del negocio.
        </p>
        <button type="button" className="boton boton-ancho" onClick={() => signOut(auth)}>
          Usar otra cuenta
        </button>
      </Acceso>
    )
  }
  return <Tablero usuario={sesion.usuario} />
}

/** Pantalla centrada con la marca del negocio, para inicio de sesión y estados de acceso. */
function Acceso({ children }: { children: ReactNode }) {
  return (
    <main className="acceso">
      <div className="acceso-tarjeta">
        <div className="marca">
          <span className="marca-logo">{iniciales(negocio.nombre)}</span>
          <div>
            <p className="marca-nombre">{negocio.nombre}</p>
            <p className="texto-suave">Mostrador</p>
          </div>
        </div>
        {children}
      </div>
    </main>
  )
}

function InicioSesion() {
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [error, setError] = useState('')
  const [entrando, setEntrando] = useState(false)

  async function entrar(e: FormEvent) {
    e.preventDefault()
    setEntrando(true)
    setError('')
    try {
      await signInWithEmailAndPassword(auth, correo.trim(), contrasena)
    } catch {
      setError('Correo o contraseña incorrectos.')
    } finally {
      setEntrando(false)
    }
  }

  return (
    <Acceso>
      <form className="login" onSubmit={entrar}>
        <h2>Iniciar sesión</h2>
        <label className="campo">
          <span>Correo</span>
          <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} autoComplete="username" required />
        </label>
        <label className="campo">
          <span>Contraseña</span>
          <input
            type="password"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {error && <p className="aviso aviso-error">{error}</p>}
        <button type="submit" className="boton boton-grande boton-ancho" disabled={entrando}>
          {entrando ? (
            <>
              <span className="cargando" aria-hidden="true" /> Entrando…
            </>
          ) : (
            <>
              <span>Entrar</span>
              <span aria-hidden="true">→</span>
            </>
          )}
        </button>
      </form>
    </Acceso>
  )
}

function aPedido(documento: QueryDocumentSnapshot<DocumentData>): Pedido {
  const datos = documento.data({ serverTimestamps: 'estimate' })
  return { ...(datos as Omit<Pedido, 'id' | 'creadoEn'>), id: documento.id, creadoEn: datos.creadoEn?.toDate() ?? null }
}

function Tablero({ usuario }: { usuario: User }) {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [conectado, setConectado] = useState(true)
  const [error, setError] = useState('')
  const [avisos, setAvisos] = useState(audioActivo())
  const [, setReloj] = useState(0)

  // Pedidos activos en tiempo real. Se ordenan aquí para no requerir un índice compuesto en Firestore.
  useEffect(() => {
    let primeraCarga = true
    const consulta = query(collection(db, 'pedidos'), where('estado', 'in', ESTADOS_ACTIVOS))
    return onSnapshot(
      consulta,
      { includeMetadataChanges: true },
      (instantanea) => {
        setConectado(!instantanea.metadata.fromCache)
        setError('')
        const llegaronNuevos = instantanea
          .docChanges()
          .some((c) => c.type === 'added' && c.doc.data().estado === 'nuevo' && !primeraCarga)
        if (llegaronNuevos) sonarAviso()
        primeraCarga = false
        setPedidos(
          instantanea.docs
            .map(aPedido)
            .sort((a, b) => (a.creadoEn?.getTime() ?? 0) - (b.creadoEn?.getTime() ?? 0)),
        )
      },
      () => setError('No se pudieron leer los pedidos. Revisa la conexión o los permisos de esta cuenta.'),
    )
  }, [])

  const nuevos = pedidos.filter((p) => p.estado === 'nuevo')
  const enPreparacion = pedidos.filter((p) => p.estado === 'en_preparacion')

  // Recordatorio sonoro mientras haya pedidos sin tomar.
  useEffect(() => {
    if (!avisos || nuevos.length === 0) return
    const intervalo = setInterval(sonarAviso, RECORDATORIO_MS)
    return () => clearInterval(intervalo)
  }, [avisos, nuevos.length])

  // Actualiza los "hace X min" y vuelve a pedir la pantalla encendida al regresar a la pestaña.
  useEffect(() => {
    const intervalo = setInterval(() => setReloj((n) => n + 1), 30_000)
    const alVolver = () => {
      if (document.visibilityState === 'visible' && avisos) mantenerPantallaEncendida()
    }
    document.addEventListener('visibilitychange', alVolver)
    return () => {
      clearInterval(intervalo)
      document.removeEventListener('visibilitychange', alVolver)
    }
  }, [avisos])

  async function activarAvisos() {
    const activo = await activarAudio()
    setAvisos(activo)
    if (activo) {
      sonarAviso()
      mantenerPantallaEncendida()
    }
  }

  async function cambiarEstado(id: string, estado: EstadoPedido, motivoCancelacion?: string) {
    try {
      await updateDoc(doc(db, 'pedidos', id), {
        estado,
        actualizadoEn: serverTimestamp(),
        ...(motivoCancelacion ? { motivoCancelacion } : {}),
      })
    } catch {
      setError('No se pudo actualizar el pedido. Intenta de nuevo.')
    }
  }

  return (
    <div className="tablero">
      <header className="tablero-barra">
        <div className="marca">
          <span className="marca-logo">{iniciales(negocio.nombre)}</span>
          <div>
            <p className="marca-nombre">{negocio.nombre}</p>
            <p className="texto-suave">Mostrador · {usuario.email}</p>
          </div>
        </div>
        <div className="tablero-acciones">
          <span className={`indicador ${conectado ? 'indicador-ok' : 'indicador-mal'}`}>
            <span className="indicador-punto" aria-hidden="true" />
            {conectado ? 'En línea' : 'Sin conexión'}
          </span>
          {avisos && <span className="indicador indicador-ok">🔔 Avisos activos</span>}
          <button type="button" className="boton boton-secundario boton-chico" onClick={() => signOut(auth)}>
            Salir
          </button>
        </div>
      </header>

      {!avisos && (
        <div className="banda-avisos" role="alert">
          <p>
            <strong>🔕 Los avisos están apagados.</strong> Actívalos para escuchar cada pedido nuevo y mantener la
            pantalla encendida.
          </p>
          <button type="button" className="boton boton-alerta" onClick={activarAvisos}>
            Activar avisos
          </button>
        </div>
      )}

      {error && <p className="aviso aviso-error tablero-error">{error}</p>}

      <div className="tablero-columnas">
        <Columna titulo="Nuevos" icono="🔔" pedidos={nuevos} vacio="No hay pedidos nuevos. Aquí aparecerán al instante.">
          {(p) => (
            <Acciones
              principal="Tomar pedido"
              onPrincipal={() => cambiarEstado(p.id, 'en_preparacion')}
              onRechazar={(motivo) => cambiarEstado(p.id, 'cancelado', motivo)}
            />
          )}
        </Columna>
        <Columna titulo="En preparación" icono="👨‍🍳" pedidos={enPreparacion} vacio="Nada en preparación.">
          {(p) => (
            <Acciones
              principal="Marcar entregado"
              onPrincipal={() => cambiarEstado(p.id, 'entregado')}
              onRechazar={(motivo) => cambiarEstado(p.id, 'cancelado', motivo)}
            />
          )}
        </Columna>
      </div>
    </div>
  )
}

interface PropsColumna {
  titulo: string
  icono: string
  pedidos: Pedido[]
  vacio: string
  children: (pedido: Pedido) => ReactNode
}

function Columna({ titulo, icono, pedidos, vacio, children }: PropsColumna) {
  return (
    <section className="tablero-columna" aria-label={titulo}>
      <h2 className="tablero-columna-titulo">
        <span aria-hidden="true">{icono}</span> {titulo} <span className="contador">{pedidos.length}</span>
      </h2>
      {pedidos.length === 0 && <p className="tablero-vacio">{vacio}</p>}
      {pedidos.map((pedido) => (
        <TarjetaPedido key={pedido.id} pedido={pedido}>
          {children(pedido)}
        </TarjetaPedido>
      ))}
    </section>
  )
}

interface PropsAcciones {
  principal: string
  onPrincipal: () => void
  onRechazar: (motivo: string) => void
}

/** Botón principal y rechazo con confirmación y motivo, para no rechazar por error. */
function Acciones({ principal, onPrincipal, onRechazar }: PropsAcciones) {
  const [rechazando, setRechazando] = useState(false)
  const [motivo, setMotivo] = useState(MOTIVOS_RECHAZO[0])

  if (rechazando) {
    return (
      <div className="rechazo">
        <p className="rechazo-titulo">¿Rechazar este pedido?</p>
        <label className="campo">
          <span>Motivo</span>
          <select value={motivo} onChange={(e) => setMotivo(e.target.value)}>
            {MOTIVOS_RECHAZO.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
        <div className="rechazo-botones">
          <button type="button" className="boton boton-secundario" onClick={() => setRechazando(false)}>
            Volver
          </button>
          <button type="button" className="boton boton-peligro" onClick={() => onRechazar(motivo)}>
            Sí, rechazar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="pedido-acciones">
      <button type="button" className="boton boton-grande" onClick={onPrincipal}>
        <span>{principal}</span>
        <span aria-hidden="true">→</span>
      </button>
      <button type="button" className="boton-texto boton-texto-peligro" onClick={() => setRechazando(true)}>
        Rechazar
      </button>
    </div>
  )
}

function minutosDesde(fecha: Date | null): number {
  return fecha ? Math.floor((Date.now() - fecha.getTime()) / 60_000) : 0
}

function haceCuanto(fecha: Date | null): string {
  if (!fecha) return ''
  const minutos = minutosDesde(fecha)
  if (minutos < 1) return 'Ahora'
  if (minutos < 60) return `Hace ${minutos} min`
  return fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

/** Revisa el pedido contra los datos del proyecto: mesa vigente y total según los precios del menú. */
function revisar(pedido: Pedido): string[] {
  const alertas: string[] = []
  if (pedido.tipo === 'mesa') {
    const vigente = mesas.some((m) => m.codigo === pedido.mesa?.codigo && m.numero === pedido.mesa?.numero)
    if (!vigente) alertas.push('El código de mesa no es válido.')
  }
  const precios = pedido.lineas.map((l) => precioDeLista(l.productoId, l.tamano))
  if (precios.some((p) => p === null)) {
    alertas.push('Trae productos que no están en el menú.')
  } else {
    const esperado =
      pedido.lineas.reduce((suma, l, i) => suma + (precios[i] ?? 0) * l.cantidad, 0) +
      (pedido.tipo === 'domicilio' ? negocio.costoEnvio : 0)
    if (esperado !== pedido.total) alertas.push(`El total no coincide con el menú: debería ser ${formatearPrecio(esperado)}.`)
  }
  return alertas
}

function TarjetaPedido({ pedido, children }: { pedido: Pedido; children: ReactNode }) {
  const alertas = revisar(pedido)
  const minutos = minutosDesde(pedido.creadoEn)
  const urgencia = minutos >= 20 ? ' tiempo-tarde' : minutos >= 10 ? ' tiempo-atento' : ''
  const titulo = pedido.tipo === 'mesa' ? `Mesa ${pedido.mesa?.numero ?? '?'}` : NOMBRE_TIPO[pedido.tipo]

  return (
    <article className={`pedido pedido-${pedido.tipo}${pedido.estado === 'nuevo' ? ' pedido-nuevo' : ''}`}>
      <header className="pedido-cabecera">
        <p className="pedido-titulo">
          <span className="pedido-icono" aria-hidden="true">
            {ICONO_TIPO[pedido.tipo]}
          </span>
          {titulo}
          {pedido.estado === 'nuevo' && <span className="pedido-sello">Nuevo</span>}
        </p>
        <div className="pedido-meta">
          <span className={`pedido-tiempo${urgencia}`}>{haceCuanto(pedido.creadoEn)}</span>
          <span className="pedido-ref">#{referenciaCorta(pedido.id)}</span>
        </div>
      </header>

      {pedido.cliente && (
        <div className="pedido-cliente">
          <div>
            <p className="pedido-cliente-nombre">{pedido.cliente.nombre}</p>
            {pedido.tipo === 'domicilio' && (
              <p className="texto-suave">
                {pedido.cliente.direccion}
                {pedido.cliente.referencias && ` · ${pedido.cliente.referencias}`}
              </p>
            )}
          </div>
          <a className="boton-llamar" href={`tel:${pedido.cliente.telefono}`}>
            📞 {pedido.cliente.telefono}
          </a>
        </div>
      )}

      <ul className="pedido-lineas">
        {pedido.lineas.map((linea, i) => (
          <li key={i}>
            <span className="pedido-cantidad">{linea.cantidad}</span>
            <div>
              <p className="pedido-producto">
                {linea.nombre}
                {linea.tamano && <span className="texto-suave"> · {linea.tamano}</span>}
              </p>
              {linea.nota && <p className="pedido-nota">📝 {linea.nota}</p>}
            </div>
          </li>
        ))}
      </ul>

      <p className="pedido-total">
        <span>Total{pedido.envio > 0 && <span className="texto-suave"> (incluye envío {formatearPrecio(pedido.envio)})</span>}</span>
        <strong>{formatearPrecio(pedido.total)}</strong>
      </p>

      {alertas.map((alerta) => (
        <p key={alerta} className="aviso aviso-error">
          ⚠ {alerta}
        </p>
      ))}

      {children}
    </article>
  )
}
