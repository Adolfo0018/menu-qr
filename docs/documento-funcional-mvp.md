# Documento funcional: Menú digital con QR y pedidos (MVP)

- **Estado:** Listo para estimación (quedan pendientes menores, no bloqueantes)
- **Versión:** 0.4
- **Fecha:** 2026-10-29
- **Solicitante:** Desarrollador (proyecto personal)
- **Responsable de análisis:** Claude
- **Fuentes consultadas:** ver sección 14

## 1. Resumen ejecutivo
El objetivo es un menú digital para un negocio de frappés, snacks y productos similares. Al escanear un código QR, el cliente puede:
- consultar el menú;
- hacer su pedido desde la mesa, para recoger o a domicilio.

Todos los pedidos llegan a una **pantalla del mostrador** que se actualiza en tiempo real. El cobro se hace en caja o contra entrega.

El dueño edita precios, productos y disponibilidad desde un **panel**. El sistema usa React, se publica en Netlify y guarda la información en Firebase (plan gratuito).

## 2. Contexto previo
No hay documentos previos. Todas las decisiones salen de la conversación con el solicitante (ENT-01), del 2026-10-28 al 2026-10-29.

**Cambios de decisión durante la entrevista** (queda vigente la última):
- **Base de datos:** primero se descartó; después se aceptó Firebase.
- **Edición del menú:** primero iba a ser un archivo que solo edita el desarrollador; después se aceptó un panel con los datos en Firebase y un archivo de respaldo.

## 3. Decisiones confirmadas
| Tema | Decisión | Fuente |
|---|---|---|
| Negocio | Venta de frappés, snacks y similares | ENT-01 |
| Funciones | Ver el menú, pedir desde la mesa, para recoger y a domicilio | ENT-01 |
| Tecnología | React, publicado en Netlify | ENT-01 |
| Datos | Firebase Firestore, plan gratuito, para el menú y los pedidos | ENT-01 |
| Menú | Guardado en **un solo documento** de Firestore (1 lectura por visita), editable desde un panel, con una copia en archivo dentro del proyecto como respaldo | ENT-01 (propuesta aceptada) |
| Fotos | Dentro del proyecto, servidas por Netlify (Firebase Storage ya no es gratuito) | ENT-01 (propuesta aceptada) |
| Canal de pedidos | Todos los pedidos (mesa, recoger y domicilio) llegan a la pantalla del mostrador | ENT-01 |
| WhatsApp | Solo en pedidos a domicilio: botón opcional para mandar la ubicación por WhatsApp después de enviar el pedido | ENT-01 |
| Opciones de producto | Tamaños (con precio propio) y una nota libre ("sin hielo", "poca azúcar") | ENT-01 |
| Sin extras | No hay tipo de leche, toppings ni extras con costo | ENT-01 |
| Pago | En caja; a domicilio, contra entrega | ENT-01 |
| Roles | Administrador, mostrador/barista y mesero | ENT-01 |
| Mesas | Cantidad desconocida; debe ser configurable | ENT-01 |
| Horario | Horario automático y un interruptor manual para abrir o cerrar pedidos | ENT-01 |
| Idioma | Solo español | ENT-01 |
| Identidad visual | El negocio aún no tiene logo, colores ni fotos; se usarán de ejemplo | ENT-01 |
| QR de mesa | Cada QR lleva un código por mesa difícil de adivinar (por ejemplo, `?m=k7f2q`); el administrador puede regenerarlo si se filtra | ENT-01 (resuelve P-001) |
| Domicilio | Costo de envío fijo y configurable. Sin pedido mínimo ni zonas de cobertura | ENT-01 (resuelve P-002) |
| Datos para recoger | Nombre y teléfono | ENT-01 (resuelve P-002) |
| Dispositivo del mostrador | Aún no se sabe; la pantalla debe funcionar en tablet, computadora o celular | ENT-01 (resuelve P-005) |
| Aviso de pedido nuevo | Sonido y parpadeo hasta que alguien lo toma | ENT-01 (resuelve P-005) |
| Fotos | Solo el desarrollador las agrega o cambia en el proyecto | ENT-01 (resuelve P-013) |
| Cuentas | Firebase y Netlify a nombre del desarrollador, que administra el servicio | ENT-01 (resuelve P-014) |
| Origen del pedido | **QR de mesa = comedor:** el cliente no elige tipo de pedido, siempre es para su mesa. **URL del menú (sin QR) = fuera del local:** el cliente elige recoger o domicilio. No existe "comer aquí" sin QR de mesa; quien esté en el local sin mesa pide en caja | ENT-01 (2026-10-29) |
| Verificación | En recoger y domicilio el teléfono es obligatorio porque el negocio llama para confirmar que el pedido es real | ENT-01 (2026-10-29) |
| Uso del QR | **Solo las mesas del comedor tienen QR.** No hay QR general: los clientes de fuera entran por la URL del menú, que se comparte en redes y WhatsApp | ENT-01 (2026-10-29) |

## 4. Actores y permisos
| Actor | Qué hace | Permisos |
|---|---|---|
| Cliente | Ve el menú y hace un pedido | Sin cuenta. Solo puede **crear** pedidos y ver el estado del suyo (SUP-002) |
| Administrador | Edita el menú, precios, tamaños, productos agotados, horario, apertura y cierre, y mesas; ve todos los pedidos | Acceso total al panel |
| Mostrador / barista | Ve los pedidos nuevos y los pasa a "en preparación" y "listo" | Pedidos solamente; no edita el menú (SUP-003) |
| Mesero | Ve los pedidos de mesa listos y los marca como entregados | Pedidos de mesa solamente (SUP-003) |

## 5. Alcance
### Incluido
- **Menú público:**
  - categorías y productos con foto, descripción, tamaños y precio;
  - productos agotados visibles pero no pedibles;
  - adaptado al celular.
- **Carrito de compra:** producto, tamaño, cantidad y nota.
- **Tres tipos de pedido:**
  - **Mesa:** la mesa se identifica por el código del QR.
  - **Recoger:** se piden nombre y teléfono.
  - **Domicilio:** se piden nombre, teléfono, dirección y referencias; se suma el costo de envío fijo y se paga contra entrega.
- **Confirmación** con folio y estado del pedido visible para el cliente (SUP-002).
- **Pantalla del mostrador:**
  - pedidos en tiempo real, con sonido y parpadeo hasta que alguien los toma;
  - cambio de estado.
- **Panel de administración:**
  - menú en un documento;
  - productos agotados;
  - horario e interruptor de apertura;
  - cantidad de mesas y regeneración del código de cada mesa;
  - costo de envío a domicilio.
- **Generador de QR:** uno por mesa, con su código. Los pedidos de fuera no usan QR, sino la URL del menú.
- **Publicación:** en Netlify, con reglas de seguridad de Firestore.

### Excluido (MVP)
- Pago en línea.
- Pedidos por WhatsApp como canal principal.
- Extras o toppings con costo y tipo de leche.
- Impresión de comandas o tickets (P-009).
- Inglés.
- Varias sucursales.
- Reportes avanzados (P-011).
- Subir fotos desde el panel: las cambia el desarrollador.
- Pedido mínimo y zonas de cobertura para domicilio.

### Dependencias
- **DEP-001:** cuenta y proyecto de Firebase a nombre del desarrollador. Los crea el desarrollador; Claude no puede crear cuentas.
- **DEP-002:** cuenta de Netlify a nombre del desarrollador y, opcionalmente, un dominio propio (P-010).
- **DEP-003:** un dispositivo en el mostrador (tablet, computadora o celular) con la pantalla de pedidos siempre abierta y con volumen.
- **DEP-004:** menú real (productos, tamaños, precios), logo, colores y fotos que entrega el negocio.

## 6. Proceso esperado
**Pedido desde la mesa**
1. El cliente escanea el QR de la mesa; el sistema identifica la mesa por su código.
2. Arma su carrito: producto, tamaño, cantidad y nota.
3. Envía el pedido y ve su folio y el estado.
4. El pedido aparece en la pantalla del mostrador con sonido y parpadeo.
5. El barista lo pasa a **En preparación** y luego a **Listo**.
6. El mesero lo lleva y lo marca como **Entregado**. El cliente paga en caja.

**Pedido para recoger**
- Igual que el pedido en mesa, pero se capturan nombre y teléfono.
- Cuando está **Listo**, el cliente pasa a recogerlo y paga en caja.

**Pedido a domicilio**
1. Se capturan nombre, teléfono, dirección y referencias; el total incluye el costo de envío fijo.
2. Al enviarlo, aparece un botón opcional para mandar la ubicación por WhatsApp.
3. Estados: Nuevo → En preparación → Listo → **En camino** → Entregado. Se cobra contra entrega.

**Estados de un pedido** (propuesta)
- Mesa y recoger: Nuevo → En preparación → Listo → Entregado.
- Domicilio: Nuevo → En preparación → Listo → En camino → Entregado.
- En cualquier estado antes de Entregado se puede pasar a **Cancelado**, solo por el personal (P-003).

### Excepciones
- **Fuera de horario o con el interruptor cerrado:** el menú se ve, pero el botón de pedir está deshabilitado con un mensaje.
- **Producto agotado:** se muestra marcado y no se puede agregar. Si se agota mientras el cliente arma su carrito, se le avisa al enviar.
- **Código de mesa inválido o regenerado:** no se acepta como pedido de mesa; se le indica al cliente que escanee el QR de su mesa o que elija recoger o domicilio.
- **Firebase no responde o se agotó la cuota diaria:**
  - el menú se muestra desde el archivo de respaldo;
  - no se pueden enviar pedidos y se muestra un mensaje.

## 7. Requisitos funcionales
| ID | Requisito | Prioridad | Estado |
|---|---|---|---|
| RF-001 | El sistema debe mostrar el menú por categorías, con foto, descripción, tamaños y precios. | Alta | Confirmado |
| RF-002 | El sistema debe leer el menú desde un solo documento de Firestore y usar el archivo de respaldo si no puede leerlo. | Alta | Confirmado |
| RF-003 | El sistema debe marcar los productos agotados e impedir agregarlos al carrito. | Alta | Confirmado |
| RF-004 | El cliente debe poder agregar productos con tamaño, cantidad y nota libre, y ver el total. | Alta | Confirmado |
| RF-005 | El sistema debe identificar la mesa a partir del código del QR escaneado y rechazar códigos inválidos. | Alta | Confirmado |
| RF-006 | Sin QR de mesa, el cliente debe elegir "recoger" o "domicilio" y capturar los datos requeridos, con teléfono obligatorio para la llamada de confirmación. Con QR de mesa no se le ofrece elegir: el pedido es para su mesa. | Alta | Confirmado |
| RF-007 | El sistema debe registrar el pedido en Firestore y mostrar al cliente un folio. | Alta | Confirmado |
| RF-008 | El cliente debe poder ver el estado de su pedido en tiempo real. | Media | Pendiente (SUP-002) |
| RF-009 | En pedidos a domicilio, el sistema debe ofrecer un botón para enviar la ubicación por WhatsApp. | Media | Confirmado |
| RF-010 | El sistema debe impedir pedidos fuera del horario configurado o con el interruptor cerrado. | Alta | Confirmado |
| RF-011 | La pantalla del mostrador debe mostrar los pedidos nuevos en tiempo real, con sonido y parpadeo hasta que alguien los toma. | Alta | Confirmado |
| RF-012 | El personal debe poder cambiar el estado de un pedido según su rol. | Alta | Confirmado |
| RF-013 | El mesero debe ver los pedidos de mesa en estado Listo. | Media | Confirmado |
| RF-014 | El administrador debe poder editar categorías, productos, tamaños, precios, descripción y disponibilidad. | Alta | Confirmado |
| RF-015 | El administrador debe poder configurar el horario, el interruptor de apertura y la cantidad de mesas. | Alta | Confirmado |
| RF-016 | El sistema debe generar e imprimir o descargar los QR de cada mesa, y mostrar la URL del menú para compartirla en redes. | Alta | Confirmado |
| RF-017 | El personal debe iniciar sesión para usar el panel y la pantalla del mostrador. | Alta | Confirmado |
| RF-018 | El sistema debe mostrar los pedidos del día con su total. | Media | Propuesta (P-011) |
| RF-019 | El administrador debe poder regenerar el código de una mesa; el QR anterior deja de funcionar. | Media | Confirmado |
| RF-020 | El administrador debe poder configurar el costo de envío a domicilio. | Alta | Confirmado |

## 8. Reglas de negocio
| ID | Regla | Estado |
|---|---|---|
| RN-001 | El precio depende del tamaño elegido: total = Σ(precio del tamaño × cantidad), más el costo de envío si es a domicilio. | Confirmado |
| RN-002 | No se aceptan pedidos fuera del horario o con el interruptor cerrado. Si ambos aplican, **el interruptor manual tiene prioridad** (SUP-004). | Pendiente |
| RN-003 | El pago se hace en caja; a domicilio, contra entrega. El sistema no cobra. | Confirmado |
| RN-004 | El total que cuenta es el que se calcula con los precios vigentes del menú. El mostrador ve el total recalculado y no confía en el que envía el navegador (R-002). | Propuesta |
| RN-005 | Solo el personal puede rechazar (cancelar) un pedido, en cualquier estado activo, con confirmación y un motivo de una lista: no contestó la llamada, pedido falso o duplicado, producto agotado, fuera de la zona de entrega u otro. El motivo queda guardado en el pedido. | Confirmado (2026-10-29) |
| RN-006 | El folio es único y fácil de leer en voz alta (por ejemplo, número corto del día). | Propuesta |
| RN-007 | Un pedido de mesa solo se acepta si el código del QR corresponde a una mesa vigente. | Confirmado |
| RN-008 | El costo de envío es un monto fijo para todos los domicilios; no hay pedido mínimo. | Confirmado |

## 9. Datos
- **Menú** (un documento):
  - categorías con su orden;
  - productos: nombre, descripción, foto, tamaños con precio, disponible sí/no;
  - horario por día;
  - interruptor de apertura;
  - mesas con su código;
  - costo de envío.
- **Pedido:**
  - folio y tipo (mesa, recoger o domicilio);
  - mesa o datos del cliente (nombre, teléfono, dirección, referencias);
  - productos (producto, tamaño, cantidad, nota, precio) y total;
  - estado y fechas de cada cambio de estado;
  - quién cambió el estado.
- **Personal:** usuarios de Firebase con su rol.
- **Privacidad:** se guardan nombre, teléfono y dirección de clientes a domicilio. Hace falta un aviso de privacidad y definir cuánto tiempo se guardan esos datos (P-012).

## 10. Requisitos no funcionales
| ID | Requisito | Estado |
|---|---|---|
| RNF-001 | El menú carga y se usa bien en celulares. | Confirmado |
| RNF-002 | Cada visita al menú consume como máximo 1 lectura de Firestore, para mantenerse en el plan gratuito (50 mil lecturas y 20 mil escrituras al día). | Confirmado |
| RNF-003 | Reglas de seguridad de Firestore: los clientes solo crean pedidos con formato válido y leen únicamente el suyo; solo el personal con sesión lee y edita pedidos; solo el administrador edita el menú. | Confirmado |
| RNF-004 | Protección contra pedidos falsos o automatizados (por ejemplo, Firebase App Check). | Pendiente (R-001) |
| RNF-005 | Los colores, el logo y los textos del negocio se cambian por configuración, sin tocar el código. | Propuesta |
| RNF-006 | La pantalla del mostrador funciona en tablet, computadora y celular con navegadores actuales, y pide mantener la pantalla encendida mientras está abierta. | Confirmado |
| RNF-007 | Los navegadores no reproducen sonido hasta que el usuario toca la página; al abrir la pantalla del mostrador, el personal toca "Activar avisos". | Confirmado (restricción técnica) |

## 11. Criterios de aceptación
### CA-001 — Pedido en mesa
- **Dado:** el QR de la mesa 4 y el negocio abierto.
- **Cuando:** el cliente pide 2 frappés grandes con la nota "sin hielo".
- **Entonces:**
  - El pedido aparece en la pantalla del mostrador como "Mesa 4", con la nota y el total.
  - Suena un aviso.
  - El cliente ve su folio.

### CA-002 — Cálculo por tamaño
- **Dado:** un frappé con tamaño mediano a $65 y grande a $75.
- **Cuando:** el cliente agrega 2 grandes y 1 mediano.
- **Entonces:** el total es $215.

  (Precios de ejemplo.)

### CA-003 — Producto agotado
- **Dado:** un producto marcado como agotado en el panel.
- **Cuando:** el cliente abre el menú.
- **Entonces:** el producto se ve como "Agotado" y no se puede agregar.

### CA-004 — Fuera de horario
- **Dado:** la hora actual fuera del horario configurado.
- **Cuando:** el cliente intenta pedir.
- **Entonces:** el botón de pedir está deshabilitado y se muestra el horario.

### CA-005 — Cierre manual
- **Dado:** el negocio dentro de su horario.
- **Cuando:** el administrador cierra los pedidos con el interruptor.
- **Entonces:** ya no se pueden enviar pedidos, aunque se siga viendo el menú.

### CA-006 — Pedido a domicilio
- **Dado:** un cliente que abre la URL del menú, sin QR de mesa.
- **Cuando:** elige domicilio y captura sus datos.
- **Entonces:**
  - El pedido llega al mostrador marcado como "Domicilio", con la dirección.
  - Al cliente se le ofrece mandar su ubicación por WhatsApp.

### CA-007 — Seguridad
- **Dado:** una persona sin sesión iniciada.
- **Cuando:** intenta leer los pedidos de otros o editar el menú.
- **Entonces:** Firestore rechaza la operación.

### CA-008 — Respaldo del menú
- **Dado:** que Firestore no responde.
- **Cuando:** el cliente abre el menú.
- **Entonces:**
  - Se muestra el menú del archivo de respaldo.
  - Se indica que por el momento no se pueden recibir pedidos.

### CA-009 — Permisos del barista
- **Dado:** un usuario con rol de barista.
- **Cuando:** intenta editar un precio.
- **Entonces:** no tiene acceso a esa función.

### CA-010 — Código de mesa inválido
- **Dado:** que el administrador regeneró el código de la mesa 3.
- **Cuando:** alguien usa el QR anterior de la mesa 3 para pedir.
- **Entonces:** el pedido no se acepta como pedido de mesa y se le pide escanear el QR vigente o elegir recoger o domicilio.

### CA-011 — Costo de envío
- **Dado:** un costo de envío configurado de $30.
- **Cuando:** el cliente pide a domicilio productos por $150.
- **Entonces:** el total mostrado es $180, con el envío desglosado.

  (Montos de ejemplo.)

### CA-012 — Aviso de pedido nuevo
- **Dado:** la pantalla del mostrador abierta con los avisos activados.
- **Cuando:** entra un pedido nuevo.
- **Entonces:** suena un aviso y el pedido parpadea hasta que alguien lo pasa a "En preparación".

## 12. Supuestos y preguntas pendientes
### Supuestos por validar
| ID | Supuesto | Impacto si es incorrecto |
|---|---|---|
| SUP-001 | Es una sola sucursal | Habría que separar menú y pedidos por sucursal |
| SUP-002 | El cliente puede ver el estado de su pedido (enlace con un identificador difícil de adivinar) | Si no se quiere, se simplifica |
| SUP-003 | El barista y el mesero no editan el menú; el mesero solo ve pedidos de mesa | Ajustar permisos |
| SUP-004 | El interruptor manual tiene prioridad sobre el horario automático | Cambia la regla RN-002 |

### Preguntas pendientes
| ID | Pregunta | Prioridad |
|---|---|---|
| P-003 | ¿El cliente puede cancelar su pedido mientras está en "Nuevo", o solo el personal? | Menor |
| P-004 | ¿Se muestra un tiempo estimado de preparación? | Menor |
| P-009 | ¿Hará falta imprimir comandas o tickets más adelante? | Menor |
| P-010 | ¿Se usará un dominio propio o el de Netlify (`nombre.netlify.app`)? | Menor |
| P-011 | ¿Qué reportes necesita el dueño (ventas del día, productos más vendidos)? | Menor |
| P-012 | ¿Cuánto tiempo se guardan los datos de clientes a domicilio? | Menor |
| P-015 | La llamada de confirmación de pedidos para recoger o a domicilio, ¿debe quedar registrada en el sistema (por ejemplo, un estado "Por confirmar" antes de "En preparación")? Se decide en la fase 4 | Importante |

### Preguntas resueltas (2026-10-29)
| ID | Resolución |
|---|---|
| P-001 | El QR de mesa lleva un código difícil de adivinar y regenerable |
| P-002 | Recoger: nombre y teléfono. Domicilio: costo de envío fijo, sin pedido mínimo ni zonas |
| P-005 | Dispositivo por definir (debe funcionar en cualquiera); aviso con sonido y parpadeo |
| P-013 | Las fotos las cambia solo el desarrollador |
| P-014 | Las cuentas de Firebase y Netlify están a nombre del desarrollador |

## 13. Riesgos
| ID | Riesgo | Mitigación |
|---|---|---|
| R-001 | Pedidos falsos o automatizados, porque cualquiera puede crear pedidos sin servidor propio | Reglas de Firestore con validación de formato, Firebase App Check y opción del personal para cancelar |
| R-002 | Un usuario malicioso manipula los precios enviados desde el navegador | El mostrador recalcula el total con el menú vigente (RN-004); además, el cobro es en caja |
| R-003 | La pantalla del mostrador se cierra o la tablet se duerme y no se ven los pedidos | Mantener la pantalla siempre encendida, usar aviso sonoro e indicar visualmente si se perdió la conexión |
| R-004 | Se rebasa la cuota gratuita (poco probable: unas 11 mil lecturas estimadas de 50 mil) | Menú en un solo documento y archivo de respaldo |
| R-005 | Los clientes envían el pedido "a domicilio" sin dirección útil | Campos obligatorios y botón de ubicación por WhatsApp |
| R-006 | Alguien comparte la foto del QR de una mesa y pide desde fuera | El administrador regenera el código de esa mesa (RF-019) y el personal cancela el pedido |
| R-007 | El negocio depende del desarrollador, porque las cuentas están a su nombre | Acordar por escrito el servicio y la entrega de datos si termina la relación; usar un proyecto de Firebase y un sitio de Netlify separados por cliente |
| R-008 | El sonido no suena porque no se activaron los avisos o el dispositivo está en silencio | Indicador visible de "avisos desactivados" y el parpadeo como respaldo |

## 14. Fuentes
| ID | Fuente | Uso |
|---|---|---|
| ENT-01 | Conversación con el solicitante, 2026-10-28 y 2026-10-29 | Todas las decisiones confirmadas |

No había documentación previa del proyecto.

## 15. Siguiente paso recomendado
1. Validar los supuestos SUP-001 a SUP-004 (sucursal única, estado visible para el cliente, permisos de barista y mesero, prioridad del interruptor).
2. Crear la cuenta y el proyecto de Firebase y la cuenta de Netlify (DEP-001, DEP-002).
3. Instalar Node.js en la máquina de desarrollo para compilar y probar localmente.
4. Empezar a construir siguiendo el plan por fases de la sección 16, comenzando por la fase 1.

## 16. Plan por fases
Acordado con el solicitante el 2026-10-29. Al terminar cada fase hay algo publicado en Netlify que el negocio puede usar o probar. Una fase se da por terminada cuando cumple sus criterios de aceptación y el solicitante la revisa.

| Fase | Qué se entrega | Al terminar, el negocio puede… | Tamaño | Requisitos | Criterios de aceptación | Depende de |
|---|---|---|---|---|---|---|
| **1. Menú público** | Proyecto React publicado en Netlify. Menú leído desde un archivo del proyecto: categorías, productos, tamaños, precios y agotados. Colores, logo y textos configurables | Compartir la URL del menú, sin pedidos | Chico | RF-001, RF-003, RNF-001, RNF-005 | CA-002 (precios por tamaño), CA-003 | Node.js y cuenta de Netlify |
| **2. Carrito y armado del pedido** | Carrito con tamaño, cantidad y nota. QR de mesa = pedido para esa mesa, sin elegir. URL = recoger o domicilio, con teléfono obligatorio y costo de envío. Resumen final, sin envío. **Generador de QR por mesa** (mesas en archivo) | Probar el flujo completo del cliente e imprimir los QR de las mesas | Chico | RF-004, RF-005, RF-006, RF-016, RN-001, RN-007, RN-008 | CA-002, CA-011 | Fase 1 |
| **3. Pedidos en tiempo real** | Pedidos guardados en Firebase. Pantalla del mostrador en tiempo real con sonido, parpadeo y "Activar avisos". Inicio de sesión del personal. Reglas de seguridad básicas de Firestore | Recibir pedidos reales | Grande | RF-007, RF-011, RF-017, RNF-002, RNF-003, RNF-006, RNF-007 | CA-001, CA-006, CA-007, CA-012 | Fase 2 y proyecto de Firebase |
| **4. Flujo completo del pedido** | Estados (listo, en camino), vista del mesero, folio corto, estado visible para el cliente, total recalculado en el mostrador | Operar el ciclo completo con barista y mesero | Mediano | RF-008, RF-009, RF-012, RF-013, RN-004, RN-005, RN-006 | CA-009 | Fase 3 |
| **5. Panel del menú** | El menú pasa a un solo documento de Firestore con el archivo como respaldo. Edición de categorías, productos, tamaños, precios y agotados | Que el dueño cambie precios y agotados sin el desarrollador | Mediano | RF-002, RF-014 | CA-003, CA-008 | Fase 3 |
| **6. Configuración de operación** | Horario e interruptor de apertura, mesas administradas desde el panel con regeneración de código, costo de envío editable | Controlar cuándo se reciben pedidos y administrar las mesas sin el desarrollador | Mediano | RF-010, RF-015, RF-019, RF-020, RN-002 | CA-004, CA-005, CA-010 | Fase 3 (puede ir antes o después de la fase 5) |
| **7. Salida a producción** | Protección contra pedidos falsos (App Check), revisión final de reglas, pedidos del día, aviso de privacidad, dominio y prueba con el negocio | Operar en producción | Chico a mediano | RF-018, RNF-004 | Todos | Fases 1 a 6 |

### Notas del plan
- **La fase 1 ya se puede usar:** la URL del menú funciona como menú digital desde que se publica.
- **Cambio del 2026-10-29:** se eliminó el "QR general". Solo las mesas tienen QR; el generador por mesa pasó de la fase 6 a la fase 2.
- **Cambio del 2026-10-29:** "Rechazar pedido" (estado cancelado con motivo, RN-005) se adelantó de la fase 4 a la fase 3, porque el negocio lo necesita para operar. El mostrador también recibió el rediseño visual.
- **Seguridad desde la fase 3:** las reglas de Firestore se publican junto con el primer pedido guardado; nunca se publica Firebase sin reglas.
- **Códigos de mesa:** en las fases 2 y 3 viven en el archivo de configuración; en la fase 6 pasan al panel con regeneración.
- **Fases 5 y 6:** son independientes entre sí; su orden se decide según lo que el negocio necesite primero.
- **Tamaño:** es una medida relativa entre fases, no una estimación de tiempo.
