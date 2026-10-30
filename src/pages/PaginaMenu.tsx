import { useCallback, useEffect, useState } from 'react'
import { AvisoFlotante, type AvisoBreve } from '../components/Aviso'
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
  const [elegido, setElegido] = useState<{ producto: Producto; icono: string } | null>(null)
  const [carritoAbierto, setCarritoAbierto] = useState(false)
  const [aviso, setAviso] = useState<AvisoBreve | null>(null)
  const ocultarAviso = useCallback(() => setAviso(null), [])

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
      {mesa && (
        <div className="mesa-aviso">
          <span className="mesa-aviso-numero">{mesa.numero}</span>
          <p>
            <strong>Estás en la mesa {mesa.numero}</strong>
            <span>Tu pedido llega directo a tu mesa</span>
          </p>
        </div>
      )}
      {codigoInvalido && (
        <p className="mesa-aviso mesa-aviso-alerta">
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
              <span className="seccion-icono" aria-hidden="true">
                {categoria.icono}
              </span>
              {categoria.nombre}
              <span className="seccion-cantidad">{categoria.productos.length}</span>
            </h2>
            <div className="productos">
              {categoria.productos.map((producto) => (
                <TarjetaProducto
                  key={producto.id}
                  producto={producto}
                  icono={categoria.icono}
                  onAgregar={(producto) => setElegido({ producto, icono: categoria.icono })}
                />
              ))}
            </div>
          </section>
        ))}
      </main>
      <PiePagina />
      <AvisoFlotante aviso={aviso} onOcultar={ocultarAviso} />
      <BarraCarrito onAbrir={() => setCarritoAbierto(true)} />
      <SelectorProducto
        producto={elegido?.producto ?? null}
        icono={elegido?.icono ?? ''}
        onCerrar={() => setElegido(null)}
        onAgregado={(texto) => setAviso({ texto, id: Date.now() })}
      />
      <PanelCarrito abierto={carritoAbierto} onCerrar={() => setCarritoAbierto(false)} mesa={mesa} />
    </ProveedorCarrito>
  )
}
