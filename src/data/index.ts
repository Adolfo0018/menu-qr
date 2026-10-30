import type { Menu, Mesa, Negocio } from '../types'
import menuJson from './menu.json'
import mesasJson from './mesas.json'
import negocioJson from './negocio.json'

// Anotar el tipo hace que `npm run build` falle si los JSON tienen un campo mal escrito.
export const negocio: Negocio = negocioJson
export const menu: Menu = menuJson
export const mesas: Mesa[] = mesasJson
