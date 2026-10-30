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
import { useEffect, useState, type FormEvent } from 'react'
import { mesas, negocio } from '../data'
import { activarAudio, audioActivo, mantenerPantallaEncendida, sonarAviso } from '../lib/avisos'
import { auth, db } from '../lib/firebase'
import { formatearPrecio } from '../lib/formato'
import { NOMBRE_TIPO, precioDeLista, referenciaCorta } from '../lib/pedido'
import type { EstadoPedido, Pedido } from '../types'

const ESTADOS_ACTIVOS: EstadoPedido[] = ['nuevo', 'en_preparacion']
const RECORDATORIO_MS = 20_000

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

  if (sesion.estado === 'cargando') return <p className="mostrador-centro">Cargando…</p>
  if (sesion.estado === 'fuera') return <InicioSesion />
  if (sesion.estado === 'sin-acceso') {
    return (
      <div className="mostrador-centro">
        <h1>Sin acceso</h1>
        <p>
          La cuenta <strong>{sesion.usuario.email}</strong> no está dada de alta como personal del negocio.
        </p>
        <button type="button" className="boton" onClick={() => signOut(auth)}>
          Salir
        </button>
      </div>
    )
  }
  return <Tablero usuario={sesion.usuario} />
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
    <main className="mostrador-centro">
      <form className="login" onSubmit={entrar}>
        <h1>Mostrador</h1>
        <p className="texto-suave">{negocio.nombre}</p>
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
        <button type="submit" className="boton boton-ancho" disabled={entrando}>
          {entrando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
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

  async function cambiarEstado(id: string, estado: EstadoPedido) {
    try {
      await updateDoc(doc(db, 'pedidos', id), { estado, actualizadoEn: serverTimestamp() })
    } catch {
      setError('No se pudo actualizar el pedido. Intenta de nuevo.')
    }
  }

  return (
    <div className="mostrador">
      <header className="mostrador-barra">
        <div>
          <h1>Mostrador</h1>
          <p className="texto-suave">{usuario.email}</p>
        </div>
        <div className="mostrador-acciones">
          <span className={`indicador ${conectado ? 'indicador-ok' : 'indicador-mal'}`}>
            {conectado ? 'Conectado' : 'Sin conexión'}
          </span>
          {avisos ? (
            <span className="indicador indicador-ok">🔔 Avisos activos</span>
          ) : (
            <button type="button" className="boton boton-alerta" onClick={activarAvisos}>
              🔕 Activar avisos
            </button>
          )}
          <button type="button" className="boton boton-secundario" onClick={() => signOut(auth)}>
            Salir
          </button>
        </div>
      </header>

      {error && <p className="aviso aviso-error mostrador-error">{error}</p>}

      <div className="mostrador-columnas">
        <Columna titulo="Nuevos" pedidos={nuevos} vacio="Sin pedidos nuevos.">
          {(p) => (
            <button type="button" className="boton boton-ancho" onClick={() => cambiarEstado(p.id, 'en_preparacion')}>
              Tomar pedido
            </button>
          )}
        </Columna>
        <Columna titulo="En preparación" pedidos={enPreparacion} vacio="Nada en preparación.">
          {(p) => (
            <button type="button" className="boton boton-secundario boton-ancho" onClick={() => cambiarEstado(p.id, 'entregado')}>
              Marcar entregado
            </button>
          )}
        </Columna>
      </div>
    </div>
  )
}

interface PropsColumna {
  titulo: string
  pedidos: Pedido[]
  vacio: string
  children: (pedido: Pedido) => React.ReactNode
}

function Columna({ titulo, pedidos, vacio, children }: PropsColumna) {
  return (
    <section className="mostrador-columna" aria-label={titulo}>
      <h2>
        {titulo} <span className="contador">{pedidos.length}</span>
      </h2>
      {pedidos.length === 0 && <p className="texto-suave">{vacio}</p>}
      {pedidos.map((pedido) => (
        <TarjetaPedido key={pedido.id} pedido={pedido}>
          {children(pedido)}
        </TarjetaPedido>
      ))}
    </section>
  )
}

function haceCuanto(fecha: Date | null): string {
  if (!fecha) return ''
  const minutos = Math.floor((Date.now() - fecha.getTime()) / 60_000)
  if (minutos < 1) return 'ahora'
  if (minutos < 60) return `hace ${minutos} min`
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

function TarjetaPedido({ pedido, children }: { pedido: Pedido; children: React.ReactNode }) {
  const alertas = revisar(pedido)
  const titulo = pedido.tipo === 'mesa' ? `Mesa ${pedido.mesa?.numero ?? '?'}` : NOMBRE_TIPO[pedido.tipo]

  return (
    <article className={`pedido pedido-${pedido.tipo}${pedido.estado === 'nuevo' ? ' pedido-nuevo' : ''}`}>
      <header className="pedido-cabecera">
        <p className="pedido-titulo">{titulo}</p>
        <p className="texto-suave">
          {referenciaCorta(pedido.id)} · {haceCuanto(pedido.creadoEn)}
        </p>
      </header>

      {pedido.cliente && (
        <div className="pedido-cliente">
          <p>
            <strong>{pedido.cliente.nombre}</strong> · <a href={`tel:${pedido.cliente.telefono}`}>{pedido.cliente.telefono}</a>
          </p>
          {pedido.tipo === 'domicilio' && (
            <p>
              {pedido.cliente.direccion}
              {pedido.cliente.referencias && <span className="texto-suave"> ({pedido.cliente.referencias})</span>}
            </p>
          )}
        </div>
      )}

      <ul className="pedido-lineas">
        {pedido.lineas.map((linea, i) => (
          <li key={i}>
            <span className="pedido-cantidad">{linea.cantidad}×</span> {linea.nombre}
            {linea.tamano && <span className="texto-suave"> · {linea.tamano}</span>}
            {linea.nota && <p className="linea-nota">“{linea.nota}”</p>}
          </li>
        ))}
      </ul>

      <p className="pedido-total">
        Total {formatearPrecio(pedido.total)}
        {pedido.envio > 0 && <span className="texto-suave"> (incluye envío {formatearPrecio(pedido.envio)})</span>}
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
