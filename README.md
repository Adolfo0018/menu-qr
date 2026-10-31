# Menú QR

Menú digital para un negocio de frappés y snacks, hecho con React + Vite y publicado en Netlify.
La definición completa y el plan por fases están en [docs/documento-funcional-mvp.md](docs/documento-funcional-mvp.md).

**Fase actual: 3 — Pedidos en tiempo real.** Los pedidos se guardan en Firebase (Firestore) y aparecen en la pantalla del mostrador (`/mostrador`) con sonido y parpadeo.

## Cómo entran los clientes

| Dónde está el cliente | Cómo entra | Qué puede pedir |
|---|---|---|
| Sentado en el comedor | Escanea el **QR de su mesa** | Solo para su mesa; no elige nada |
| Fuera del local | Abre la **URL del menú** (enlace en redes o WhatsApp) | Para recoger o a domicilio, con teléfono obligatorio para confirmar |

Solo las mesas tienen QR. Los pedidos de fuera no usan QR.

## Requisitos

- Node 26 (está en `.nvmrc`). Con nvm-windows: `nvm install 26.13.0` y `nvm use 26.13.0`.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm install` | Instala dependencias (solo la primera vez) |
| `npm run dev` | Abre el menú en `http://localhost:5173` con recarga automática |
| `npm run build` | Revisa tipos y genera la versión publicable en `dist/` |
| `npm run preview` | Sirve `dist/` para probar la versión publicable |

## Páginas

| Ruta | Qué muestra |
|---|---|
| `/` | Menú para pedidos de fuera (la URL que se comparte) |
| `/?m=CODIGO` | Menú abierto desde el QR de una mesa (ver "Mesas") |
| `/qr` | QR de todas las mesas: descarga en PNG o imprime todos |
| `/mostrador` | Pantalla de pedidos para el personal (requiere inicio de sesión) |

## Firebase

Proyecto: `menu-4de7c`, plan Spark (gratuito). La configuración web está en `src/lib/firebase.ts`: no es secreta, lo que protege los datos son las reglas de `firestore.rules`.

| Colección | Qué guarda | Quién escribe |
|---|---|---|
| `pedidos` | Un documento por pedido | Clientes crean; el personal solo cambia `estado` |
| `personal` | Un documento por persona del negocio, con el **UID** de Authentication como id | Solo a mano desde la consola |

### Publicar las reglas de seguridad

Cada vez que cambie `firestore.rules`:

1. Consola de Firebase → **Bases de datos y almacenamiento → Firestore → Reglas**.
2. Reemplaza todo el contenido por el de `firestore.rules` y da clic en **Publicar**.

### Dar de alta a alguien del personal

1. **Seguridad → Authentication → Usuarios → Agregar usuario**: correo y contraseña. Copia el **UID** que aparece en la lista.
2. **Firestore → Datos → Iniciar colección** (o abre `personal` si ya existe):
   - ID de la colección: `personal`
   - ID del documento: el **UID** copiado
   - Campo: `nombre` (string) con el nombre de la persona.
3. Esa persona ya puede entrar en `/mostrador`.

Para quitarle el acceso, borra su documento en `personal` (y, si quieres, su usuario en Authentication).

Recomendado: en **Authentication → Configuración → Acciones del usuario**, desactiva **Habilitar la creación (registro)** para que nadie pueda crear cuentas desde fuera.

### Pantalla del mostrador

- Al abrirla, toca **Activar avisos**: los navegadores no reproducen sonido hasta que alguien toca la página. También mantiene la pantalla encendida mientras la pestaña esté visible.
- Para silenciarlos, toca **🔔 Avisos activos · Apagar** en la barra superior: deja de sonar y la pantalla se puede apagar normalmente. Los pedidos nuevos siguen llegando y parpadeando.
- Cada pedido nuevo suena y parpadea hasta que alguien lo **toma**; mientras haya pedidos sin tomar, suena un recordatorio cada 20 segundos.
- La tarjeta avisa si el código de mesa no es válido o si el total no coincide con los precios del menú.

## Cómo editar el menú

Todo está en `src/data/`:

- **`negocio.json`**: nombre, eslogan, logo, horario, dirección, teléfono, redes y colores.
  - `urlPublica`: pon aquí la URL de Netlify (o tu dominio); es la base de los QR de mesa.
  - `logo`: ruta a una imagen dentro de `public/`, por ejemplo `"/img/logo.png"`. Vacío = iniciales del nombre.
- **`menu.json`**: categorías y productos.

Campos de un producto:

```json
{
  "id": "frappe-moka",
  "nombre": "Frappé moka",
  "descripcion": "Café, chocolate y leche, con crema batida.",
  "foto": "/img/productos/frappe-moka.jpg",
  "etiquetas": ["Favorito"],
  "disponible": true,
  "tamanos": [
    { "nombre": "Mediano", "precio": 65 },
    { "nombre": "Grande", "precio": 75 }
  ]
}
```

- `id`: único, sin espacios ni acentos. Lo usarán los pedidos en la fase 2; no lo cambies una vez publicado.
- `foto`: vacío = se muestra el icono de la categoría. Las fotos van en `public/img/productos/` (de preferencia `.jpg` o `.webp` cuadradas, menos de 200 KB).
- `disponible: false` muestra el producto como **Agotado**.
- Producto con un solo precio: un solo tamaño con `"nombre": ""`.

Si un campo está mal escrito, `npm run build` marca el error antes de publicar.

## Costo de envío

`costoEnvio` en `negocio.json` se suma a todos los pedidos a domicilio. Con `0` no se muestra el renglón de envío.

## Mesas

Hasta la fase 6 (donde se administran desde el panel), las mesas están en **`src/data/mesas.json`**:

```json
[{ "numero": 1, "codigo": "r23qj8x4" }]
```

- El QR de cada mesa abre `https://TU-SITIO/?m=CODIGO`. La página `/qr` genera e imprime los QR de todas las mesas de este archivo.
- El código debe ser difícil de adivinar (8 letras y números al azar). Para generar uno:

  ```bash
  node -e "console.log(require('crypto').randomBytes(6).toString('base64url'))"
  ```

- **Si un QR se filtra**, cambia el código de esa mesa, publica e imprime el QR nuevo. El anterior deja de funcionar y muestra un aviso al cliente.
- Si el cliente abre el menú sin código de mesa (por la URL), solo puede elegir "para recoger" o "a domicilio".

## Publicar en Netlify

**Opción A, desde GitHub (recomendada):** sube esta carpeta a un repositorio, en Netlify elige *Add new site → Import an existing project* y selecciona el repositorio. `netlify.toml` ya trae el comando de compilación, la carpeta `dist` y la redirección para `/qr`. Cada `git push` vuelve a publicar.

**Opción B, manual:** ejecuta `npm run build` y arrastra la carpeta `dist/` a [app.netlify.com/drop](https://app.netlify.com/drop).

Después de publicar:

1. Copia la URL pública (por ejemplo `https://mi-menu.netlify.app`) en `urlPublica` de `negocio.json` y publica de nuevo.
2. Abre `/qr` en el sitio publicado e imprime los QR de las mesas (o descarga cada uno en PNG).
3. Prueba cada QR impreso con dos celulares distintos antes de ponerlo en su mesa.
4. Comparte la URL del menú (sin `?m=`) en redes y WhatsApp para los pedidos de fuera.

El QR apunta a la URL, no al contenido: aunque cambien precios o productos, no hay que reimprimirlo. Solo se reimprime el QR de una mesa si cambias su código.
