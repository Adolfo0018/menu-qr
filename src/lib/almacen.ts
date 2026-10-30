// localStorage/sessionStorage pueden fallar (modo privado, almacenamiento bloqueado);
// en ese caso la app sigue funcionando, solo sin recordar datos.

type Tipo = 'local' | 'session'

function almacen(tipo: Tipo): Storage {
  return tipo === 'local' ? window.localStorage : window.sessionStorage
}

export function leer<T>(clave: string, tipo: Tipo = 'local'): T | null {
  try {
    const texto = almacen(tipo).getItem(clave)
    return texto ? (JSON.parse(texto) as T) : null
  } catch {
    return null
  }
}

export function guardar(clave: string, valor: unknown, tipo: Tipo = 'local'): void {
  try {
    almacen(tipo).setItem(clave, JSON.stringify(valor))
  } catch {
    // Sin almacenamiento disponible.
  }
}

export function borrar(clave: string, tipo: Tipo = 'local'): void {
  try {
    almacen(tipo).removeItem(clave)
  } catch {
    // Sin almacenamiento disponible.
  }
}
