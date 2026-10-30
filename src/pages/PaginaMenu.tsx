import { useEffect, useState } from 'react'
import { BarraCarrito } from '../components/BarraCarrito'
import { Encabezado } from '../components/Encabezado'
import { NavCategorias } from '../components/NavCategorias'
import { PanelCarrito } from '../components/PanelCarrito'
import { PiePagina } from '../components/PiePagina'
import { SelectorProducto } from '../components/SelectorProducto'
import { TarjetaProducto } from '../components/TarjetaProducto'
import { menu } from '../data'
import { ProveedorCarrito } from '../lib/carrito'
import { detectarMesa } from '../lib/mesa'
import type { Producto } from '../types'

const idSeccion = (categoriaId: string) => `cat-${categoriaId}`

const categorias = menu.categorias.filter((c) => c.productos.length > 0)

export function PaginaMenu() {
  const [activa, setActiva] = useState(categorias[0]?.id ?? '')
  const [{ mesa, codigoInvalido }] = useState(detectarMesa)
  const [productoElegido, setProductoElegido] = useState<Producto | null>(null)
  const [carritoAbierto, setCarritoAbierto] = useState(false)

  // Marca en la barra la categoría que se está viendo al hacer scroll.
  useEffect(() => {
    const observador = new IntersectionObserver(
      (entradas) => {
        const visible = entradas.find((e) => e.isIntersecting)
        if (visible) setActiva(visible.target.id.replace('cat-', ''))
      },
      { rootMargin: '-120px 0px -65% 0px' },
    )
    categorias.forEach((c) => {
      const seccion = document.getElementById(idSeccion(c.id))
      if (seccion) observador.observe(seccion)
    })
    return () => observador.disconnect()
  }, [])

  function irACategoria(id: string) {
    setActiva(id)
    document.getElementById(idSeccion(id))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <ProveedorCarrito>
      <Encabezado />
      {mesa && <p className="franja">📍 Estás en la mesa {mesa.numero}</p>}
      {codigoInvalido && (
        <p className="franja franja-alerta">
          Este QR de mesa ya no es válido. Escanea el QR de tu mesa o pide para recoger o a domicilio.
        </p>
      )}
      <NavCategorias categorias={categorias} activa={activa} onElegir={irACategoria} />
      <main className="contenido">
        {categorias.map((categoria) => (
          <section
            key={categoria.id}
            id={idSeccion(categoria.id)}
            className="seccion"
            aria-labelledby={`titulo-${categoria.id}`}
          >
            <h2 id={`titulo-${categoria.id}`} className="seccion-titulo">
              <span aria-hidden="true">{categoria.icono}</span> {categoria.nombre}
            </h2>
            <div className="productos">
              {categoria.productos.map((producto) => (
                <TarjetaProducto
                  key={producto.id}
                  producto={producto}
                  icono={categoria.icono}
                  onAgregar={setProductoElegido}
                />
              ))}
            </div>
          </section>
        ))}
      </main>
      <PiePagina />
      <BarraCarrito onAbrir={() => setCarritoAbierto(true)} />
      <SelectorProducto producto={productoElegido} onCerrar={() => setProductoElegido(null)} />
      <PanelCarrito abierto={carritoAbierto} onCerrar={() => setCarritoAbierto(false)} mesa={mesa} />
    </ProveedorCarrito>
  )
}
