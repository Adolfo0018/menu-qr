import QRCode from 'qrcode'
import { useEffect, useRef, useState } from 'react'
import { negocio } from '../data'
import { urlDelMenu } from '../lib/formato'

// El QR siempre en negro sobre blanco: con colores de marca algunos lectores fallan.
const opcionesQr = {
  margin: 2,
  errorCorrectionLevel: 'M' as const,
  color: { dark: '#000000', light: '#ffffff' },
}

function esUrlLocal(url: string) {
  return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/i.test(url)
}

export function PaginaQr() {
  const [url, setUrl] = useState(urlDelMenu())
  const [error, setError] = useState('')
  const lienzo = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!lienzo.current) return
    if (!url.trim()) {
      setError('Escribe la URL del menú.')
      return
    }
    QRCode.toCanvas(lienzo.current, url.trim(), { ...opcionesQr, width: 280 })
      .then(() => setError(''))
      .catch(() => setError('No se pudo generar el QR con esa URL.'))
  }, [url])

  async function descargar() {
    const imagen = await QRCode.toDataURL(url.trim(), { ...opcionesQr, width: 1024 })
    const enlace = document.createElement('a')
    enlace.href = imagen
    enlace.download = 'qr-menu.png'
    enlace.click()
  }

  return (
    <main className="pagina-qr">
      <section className="qr-controles no-imprimir">
        <h1>QR del menú</h1>
        <p className="qr-ayuda">
          Este es el QR general: abre el menú sin mesa asignada. Los QR por mesa llegan en la fase 6.
        </p>
        <label className="campo">
          <span>URL que abrirá el QR</span>
          <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} spellCheck={false} />
        </label>
        {esUrlLocal(url) && (
          <p className="aviso">
            Esta URL solo funciona en tu computadora. Cuando publiques en Netlify, pon la URL pública en{' '}
            <code>urlPublica</code> de <code>src/data/negocio.json</code>.
          </p>
        )}
        {error && <p className="aviso aviso-error">{error}</p>}
        <div className="qr-acciones">
          <button type="button" className="boton" onClick={descargar} disabled={!!error}>
            Descargar PNG
          </button>
          <button type="button" className="boton boton-secundario" onClick={() => window.print()} disabled={!!error}>
            Imprimir
          </button>
        </div>
      </section>

      <section className="qr-tarjeta" aria-label="Vista para imprimir">
        <p className="qr-tarjeta-nombre">{negocio.nombre}</p>
        <p className="qr-tarjeta-llamado">Escanea para ver nuestro menú</p>
        <canvas ref={lienzo} className="qr-lienzo" />
        <p className="qr-tarjeta-url">{url.replace(/^https?:\/\//, '')}</p>
      </section>
    </main>
  )
}
