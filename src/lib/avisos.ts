// Sonido y pantalla encendida para el mostrador.
// Los navegadores solo permiten sonido después de que la persona toca la página,
// por eso activarAudio() se llama desde el botón "Activar avisos".

let contexto: AudioContext | null = null
let bloqueoPantalla: WakeLockSentinel | null = null

export async function activarAudio(): Promise<boolean> {
  try {
    contexto ??= new AudioContext()
    await contexto.resume()
    return contexto.state === 'running'
  } catch {
    return false
  }
}

/** Silencia los avisos y deja que la pantalla se apague normalmente. */
export async function desactivarAvisos(): Promise<void> {
  try {
    await contexto?.suspend()
  } catch {
    // Ya estaba detenido.
  }
  try {
    await bloqueoPantalla?.release()
  } catch {
    // Ya estaba liberado.
  }
  bloqueoPantalla = null
}

export function audioActivo(): boolean {
  return contexto?.state === 'running'
}

/** Dos tonos cortos, generados en el navegador (sin archivo de audio). */
export function sonarAviso(): void {
  const ctx = contexto
  if (!ctx || ctx.state !== 'running') return
  const inicio = ctx.currentTime
  ;[784, 1046].forEach((frecuencia, i) => {
    const t = inicio + i * 0.25
    const oscilador = ctx.createOscillator()
    const volumen = ctx.createGain()
    oscilador.frequency.value = frecuencia
    volumen.gain.setValueAtTime(0.0001, t)
    volumen.gain.exponentialRampToValueAtTime(0.5, t + 0.02)
    volumen.gain.exponentialRampToValueAtTime(0.0001, t + 0.22)
    oscilador.connect(volumen).connect(ctx.destination)
    oscilador.start(t)
    oscilador.stop(t + 0.25)
  })
}

/** Evita que la tablet o el celular apague la pantalla. Hay que pedirlo de nuevo al volver a la pestaña. */
export async function mantenerPantallaEncendida(): Promise<void> {
  try {
    if ('wakeLock' in navigator && (!bloqueoPantalla || bloqueoPantalla.released)) {
      bloqueoPantalla = await navigator.wakeLock.request('screen')
    }
  } catch {
    // No disponible (navegador antiguo o ahorro de batería).
  }
}
