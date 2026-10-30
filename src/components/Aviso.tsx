import { useEffect } from 'react'

export interface AvisoBreve {
  texto: string
  /** Distinto en cada aviso, para repetir la animación aunque el texto sea igual. */
  id: number
}

interface Props {
  aviso: AvisoBreve | null
  onOcultar: () => void
}

/** Mensaje breve flotante ("Agregado a tu pedido") que se oculta solo. */
export function AvisoFlotante({ aviso, onOcultar }: Props) {
  useEffect(() => {
    if (!aviso) return
    const temporizador = setTimeout(onOcultar, 2200)
    return () => clearTimeout(temporizador)
  }, [aviso, onOcultar])

  return (
    <div className="aviso-flotante-contenedor" role="status" aria-live="polite">
      {aviso && (
        <p key={aviso.id} className="aviso-flotante">
          <span className="aviso-flotante-check" aria-hidden="true">
            ✓
          </span>
          {aviso.texto}
        </p>
      )}
    </div>
  )
}
