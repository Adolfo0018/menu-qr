import { PaginaMenu } from './pages/PaginaMenu'
import { PaginaQr } from './pages/PaginaQr'

// Solo hay dos páginas; cuando haya más (mostrador, panel) se agregará un enrutador.
export default function App() {
  if (window.location.pathname.replace(/\/+$/, '') === '/qr') {
    return <PaginaQr />
  }
  return <PaginaMenu />
}
