import { negocio } from '../data'
import { iniciales } from '../lib/formato'

const GARANTIAS = [
  { icono: '⚡', texto: 'Directo a cocina' },
  { icono: '🔒', texto: 'Sin registro' },
  { icono: '💵', texto: 'Pagas al recibir' },
]

export function Encabezado() {
  return (
    <header className="hero">
      <div className="hero-contenido">
        {negocio.logo ? (
          <img className="hero-logo" src={negocio.logo} alt={`Logo de ${negocio.nombre}`} />
        ) : (
          <div className="hero-logo hero-iniciales" aria-hidden="true">
            {iniciales(negocio.nombre)}
          </div>
        )}
        <div className="hero-texto">
          <h1 className="hero-nombre">{negocio.nombre}</h1>
          {negocio.eslogan && <p className="hero-eslogan">{negocio.eslogan}</p>}
        </div>
      </div>
      {negocio.horario && <p className="hero-horario">🕒 {negocio.horario}</p>}
      <ul className="garantias" aria-label="Cómo funciona">
        {GARANTIAS.map((g) => (
          <li key={g.texto}>
            <span aria-hidden="true">{g.icono}</span> {g.texto}
          </li>
        ))}
      </ul>
    </header>
  )
}
