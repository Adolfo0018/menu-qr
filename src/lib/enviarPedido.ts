import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import type { DatosCliente, Mesa, TipoPedido } from '../types'
import { db } from './firebase'
import { calcularTotales, type LineaResuelta } from './pedido'

// Este módulo se carga solo al enviar, para que el menú no descargue Firebase al abrirse.

interface DatosEnvio {
  tipo: TipoPedido
  mesa: Mesa | null
  cliente: DatosCliente
  lineas: LineaResuelta[]
}

/** Guarda el pedido en Firestore y devuelve su id. La forma debe coincidir con firestore.rules. */
export async function enviarPedido({ tipo, mesa, cliente, lineas }: DatosEnvio): Promise<string> {
  const { subtotal, envio, total } = calcularTotales(lineas, tipo)
  const referencia = await addDoc(collection(db, 'pedidos'), {
    tipo,
    mesa: tipo === 'mesa' && mesa ? { numero: mesa.numero, codigo: mesa.codigo } : null,
    cliente:
      tipo === 'mesa'
        ? null
        : {
            nombre: cliente.nombre.trim(),
            telefono: cliente.telefono.replace(/\D/g, ''),
            direccion: tipo === 'domicilio' ? cliente.direccion.trim() : '',
            referencias: tipo === 'domicilio' ? cliente.referencias.trim() : '',
          },
    lineas: lineas.map((l) => ({
      productoId: l.productoId,
      nombre: l.producto.nombre,
      tamano: l.tamano,
      cantidad: l.cantidad,
      nota: l.nota,
      precioUnitario: l.precioUnitario,
      importe: l.importe,
    })),
    subtotal,
    envio,
    total,
    estado: 'nuevo',
    creadoEn: serverTimestamp(),
  })
  return referencia.id
}
