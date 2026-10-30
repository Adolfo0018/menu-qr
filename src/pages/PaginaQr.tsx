import QRCode from 'qrcode'
import { useEffect, useRef, useState } from 'react'
import { mesas, negocio } from '../data'
import { urlDelMenu } from '../lib/formato'
import type { Mesa } from '../types'

// El QR siempre en negro sobre blanco: con colores de marca algunos lectores fallan.
const opcionesQr = {
  margin: 2,
  errorCorrectionLevel: 'M' as const,
  color: { dark: '#000000', light: '#ffffff' },
}

function esUrlLocal(url: string) {
  return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/i.test(url)
}

function urlDeMesa(base: string, mesa: Mesa) {
  return `${base.trim().replace(/\/+$/, '')}/?m=${encodeURIComponent(mesa.codigo)}`
}

/**
 * QR de las mesas del comedor. Solo las mesas tienen QR: los pedidos de fuera
 * (recoger y domicilio) entran por la URL del menú, que se comparte en redes o WhatsApp.
 */
export function PaginaQr() {
  const [base, setBase] = useState(urlDelMenu())
  const [copiado, setCopiado] = useState(false)
  const baseValida = /^https?:\/\/\S+$/i.test(base.trim())

  async function copiarEnlace() {
    try {
      await navigator.clipboard.writeText(base.trim())
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      setCopiado(false)
    }
  }

  return (
    <main className="pagina-qr">
      <section className="qr-controles no-imprimir">
        <h1>QR de las mesas</h1>
        <p className="qr-ayuda">
          Cada mesa del comedor tiene su propio QR. Al escanearlo, el pedido queda asignado a esa mesa. Las mesas
          y sus códigos están en <code>src/data/mesas.json</code>.
        </p>
        <label className="campo">
          <span>URL del menú</span>
          <input type="url" value={base} onChange={(e) => setBase(e.target.value)} spellCheck={false} />
        </label>
        {esUrlLocal(base) && (
          <p className="aviso">
            Esta URL solo funciona en tu computadora. Usa la URL pública (<code>urlPublica</code> en{' '}
            <code>src/data/negocio.json</code>) antes de imprimir.
          </p>
        )}
        {!baseValida && <p className="aviso aviso-error">Escribe una URL que empiece con http:// o https://.</p>}

        <div className="qr-enlace">
          <p>
            <strong>Pedidos de fuera</strong> (para recoger o a domicilio): comparte este enlace en redes y WhatsApp.
            No lleva QR.
          </p>
          <button type="button" className="boton boton-secundario" onClick={copiarEnlace} disabled={!baseValida}>
            {copiado ? 'Enlace copiado' : 'Copiar enlace'}
          </button>
        </div>

        <button type="button" className="boton" onClick={() => window.print()} disabled={!baseValida}>
          Imprimir todos los QR
        </button>
      </section>

      {baseValida && (
        <section className="qr-mesas" aria-label="QR de cada mesa">
          {mesas.map((mesa) => (
            <TarjetaQrMesa key={mesa.codigo} mesa={mesa} url={urlDeMesa(base, mesa)} />
          ))}
        </section>
      )}
    </main>
  )
}

function TarjetaQrMesa({ mesa, url }: { mesa: Mesa; url: string }) {
  const lienzo = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (lienzo.current) QRCode.toCanvas(lienzo.current, url, { ...opcionesQr, width: 220 }).catch(() => {})
  }, [url])

  async function descargar() {
    const imagen = await QRCode.toDataURL(url, { ...opcionesQr, width: 1024 })
    const enlace = document.createElement('a')
    enlace.href = imagen
    enlace.download = `qr-mesa-${mesa.numero}.png`
    enlace.click()
  }

  return (
    <article className="qr-tarjeta">
      <p className="qr-tarjeta-nombre">{negocio.nombre}</p>
      <p className="qr-tarjeta-mesa">Mesa {mesa.numero}</p>
      <canvas ref={lienzo} className="qr-lienzo" />
      <p className="qr-tarjeta-llamado">Escanea para pedir desde tu mesa</p>
      <button type="button" className="boton-texto no-imprimir" onClick={descargar}>
        Descargar PNG
      </button>
    </article>
  )
}
