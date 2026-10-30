import { lazy, Suspense } from 'react'
import { PaginaMenu } from './pages/PaginaMenu'

// El menú carga primero; el mostrador (con Firebase) y el generador de QR se descargan solo al abrirlos.
const PaginaMostrador = lazy(() => import('./pages/PaginaMostrador').then((m) => ({ default: m.PaginaMostrador })))
const PaginaQr = lazy(() => import('./pages/PaginaQr').then((m) => ({ default: m.PaginaQr })))

export default function App() {
  const ruta = window.location.pathname.replace(/\/+$/, '')
  const pagina = ruta === '/mostrador' ? <PaginaMostrador /> : ruta === '/qr' ? <PaginaQr /> : <PaginaMenu />
  return <Suspense fallback={null}>{pagina}</Suspense>
}
