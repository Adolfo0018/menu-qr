# Menú QR

Menú digital para un negocio de frappés y snacks, hecho con React + Vite y publicado en Netlify.
La definición completa y el plan por fases están en [docs/documento-funcional-mvp.md](docs/documento-funcional-mvp.md).

**Fase actual: 1 — Menú público + QR general.** El menú se lee de archivos del proyecto; todavía no hay pedidos ni Firebase.

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
| `/` | Menú público |
| `/qr` | Generador del QR general: descarga en PNG o imprime |

## Cómo editar el menú

Todo está en `src/data/`:

- **`negocio.json`**: nombre, eslogan, logo, horario, dirección, teléfono, redes y colores.
  - `urlPublica`: pon aquí la URL de Netlify (o tu dominio) para que el QR apunte a ella.
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

## Publicar en Netlify

**Opción A, desde GitHub (recomendada):** sube esta carpeta a un repositorio, en Netlify elige *Add new site → Import an existing project* y selecciona el repositorio. `netlify.toml` ya trae el comando de compilación, la carpeta `dist` y la redirección para `/qr`. Cada `git push` vuelve a publicar.

**Opción B, manual:** ejecuta `npm run build` y arrastra la carpeta `dist/` a [app.netlify.com/drop](https://app.netlify.com/drop).

Después de publicar:

1. Copia la URL pública (por ejemplo `https://mi-menu.netlify.app`) en `urlPublica` de `negocio.json` y publica de nuevo.
2. Abre `/qr` en el sitio publicado, descarga el PNG o imprime la tarjeta.
3. Prueba el QR impreso con dos celulares distintos antes de ponerlo en las mesas.

El QR apunta a la URL, no al contenido: aunque cambien precios o productos, no hay que reimprimirlo.
