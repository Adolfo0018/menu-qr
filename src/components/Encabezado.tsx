import { negocio } from '../data'
import { iniciales } from '../lib/formato'

export function Encabezado() {
  return (
    <header className="encabezado">
      {negocio.logo ? (
        <img className="encabezado-logo" src={negocio.logo} alt={`Logo de ${negocio.nombre}`} />
      ) : (
        <div className="encabezado-logo encabezado-iniciales" aria-hidden="true">
          {iniciales(negocio.nombre)}
        </div>
      )}
      <div>
        <h1 className="encabezado-nombre">{negocio.nombre}</h1>
        {negocio.eslogan && <p className="encabezado-eslogan">{negocio.eslogan}</p>}
        {negocio.horario && <p className="encabezado-horario">🕒 {negocio.horario}</p>}
      </div>
    </header>
  )
}
