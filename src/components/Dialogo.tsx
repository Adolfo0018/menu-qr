import { useEffect, useRef, type ReactNode } from 'react'

interface Props {
  abierto: boolean
  onCerrar: () => void
  titulo: string
  /** "hoja": sube desde abajo en el celular. "panel": ocupa toda la pantalla en el celular. */
  variante: 'hoja' | 'panel'
  children: ReactNode
}

// <dialog> nativo: el navegador se encarga del foco, de la tecla Escape y del fondo oscuro.
export function Dialogo({ abierto, onCerrar, titulo, variante, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialogo = ref.current
    if (!dialogo) return
    if (abierto && !dialogo.open) dialogo.showModal()
    if (!abierto && dialogo.open) dialogo.close()
  }, [abierto])

  return (
    <dialog
      ref={ref}
      className={`dialogo dialogo-${variante}`}
      aria-label={titulo}
      onClose={onCerrar}
      onClick={(e) => {
        // Un clic directo en el <dialog> es un clic en el fondo oscuro.
        if (e.target === ref.current) onCerrar()
      }}
    >
      {abierto && (
        <div className="dialogo-cuerpo">
          {variante === 'hoja' && <div className="dialogo-asa" aria-hidden="true" />}
          {children}
        </div>
      )}
    </dialog>
  )
}

export function BotonCerrar({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="boton-cerrar" onClick={onClick} aria-label="Cerrar">
      ✕
    </button>
  )
}
