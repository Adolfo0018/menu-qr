import { negocio } from '../data'

export function PiePagina() {
  const redes = [
    { nombre: 'Instagram', url: negocio.instagram },
    { nombre: 'Facebook', url: negocio.facebook },
  ].filter((red) => red.url)

  return (
    <footer className="pie">
      <p className="pie-nombre">{negocio.nombre}</p>
      {negocio.direccion && <p>📍 {negocio.direccion}</p>}
      {negocio.horario && <p>🕒 {negocio.horario}</p>}
      {negocio.telefono && (
        <p>
          📞 <a href={`tel:${negocio.telefono.replace(/\s+/g, '')}`}>{negocio.telefono}</a>
        </p>
      )}
      {redes.length > 0 && (
        <p className="pie-redes">
          {redes.map((red) => (
            <a key={red.nombre} href={red.url} target="_blank" rel="noreferrer">
              {red.nombre}
            </a>
          ))}
        </p>
      )}
      <p className="pie-nota">Precios en {negocio.moneda}. Sujetos a cambio sin previo aviso.</p>
    </footer>
  )
}
