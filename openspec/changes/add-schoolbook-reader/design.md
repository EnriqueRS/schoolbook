# Design

## Context

Ver `proposal.md` para la motivación y `specs/` para el comportamiento exigido.

Lo que condiciona el diseño, ya verificado sobre los ficheros reales:

- Los 4 PDFs son **libros digitales exportados con cairo**: las páginas son vectores e imágenes a 96 ppi, **sin capa de texto y sin fuentes embebidas**. `pdftotext` devuelve vacío.
- Consecuencia buena: el render es nítido a cualquier resolución, así que un render a 145 dpi pesa ~180 KB y sirve para una pantalla de 2000 × 1200.
- Consecuencia mala: no hay texto que enviar al modelo. Todo el contenido para la IA tiene que venir de OCR.
- Las páginas del PDF **coinciden** con el número impreso (comprobado en Lengua, Matemáticas, Conocimiento y Religión).
- La máquina no tiene GPU (8 núcleos, 31 GB). El modelo elegido vive en el proxy LiteLLM local (`:4000`), no en Ollama.
- Uso doméstico en red local, sin cuentas ni progreso: no hay datos que justifiquen una base de datos.

Medidas tomadas antes de escribir esto: render a 145 dpi → WebP q82 = 182 KB/página de media, 132 MB en total (la estimación inicial de 109 MB se quedó corta); OCR con `tesseract -l spa` a 300 dpi = 3,3 s/página.

## Goals / Non-Goals

**Goals:**

- Cero paso de build en el cliente: HTML, CSS y JS servidos tal cual.
- Un único proceso Node que sirve estáticos y cuatro endpoints.
- Todo lo derivado de los PDFs (imágenes, texto OCR) es **regenerable con un comando**, no fuente de verdad.
- La ruta de lectura funciona sin llamar a la IA (y por tanto sin latencia ni coste).

**Non-Goals:**

- No hay base de datos, ni usuarios, ni sesiones, ni historial de tests.
- No se muestra el texto OCR al usuario: es material interno para los prompts.
- No se soporta orientación vertical ni móvil como experiencia principal.
- No se edita ni se anota el libro (sin subrayados, sin notas).
- No se sirven los PDFs originales al navegador en ningún caso.

## Decisions

### D1. Imágenes pre-renderizadas en vez de PDF.js

Las dos ventajas de PDF.js (seleccionar texto y buscar dentro) son **inexistentes** aquí porque no hay capa de texto; a cambio arrastra 92–211 MB por libro y un visor con controles que va justo en contra del requisito de sencillez. Se renderiza una vez a WebP y el cliente compone el pliego con dos `<img>`.

- Render: `pdftoppm -r 145 -png` + `convert -quality 82 -define webp:method=6`.
- Guardar **páginas sueltas**, no pliegos compuestos: un asset por página, ~180 KB, y el emparejamiento es una decisión de presentación (y de paridad por libro) que así puede corregirse sin volver a renderizar. Componer en CSS son tres líneas.
- Formato WebP sin alternativas en AVIF: el ahorro no compensa el coste de codificación en CPU para 749 páginas.

### D2. La tabla de temas es un fichero versionado, no un cálculo

`data/books.json` contiene los 4 libros, sus 45 temas y la paridad de pliego de cada uno. Se construye **una vez, a mano, leyendo las 4 páginas de índice a resolución real** (en el índice de Religión el número del tema 4 está tapado por el diseño, así que no es fiable automatizarlo). Se revisa a ojo y se commitea.

- El rango se calcula como `[inicio, inicio_siguiente - 1]`, que cumple la regla de que el repaso pertenece al tema anterior.
- El último tema termina en la página anterior al arranque de la sección final que el propio índice declara ("Historias para leer", "VOCABULARIO CLAVE", "Apéndice").
- La paridad de pliego se declara por libro en el mismo fichero. Se verifica una vez por libro mirando una página de márgenes asimétricos; no se deduce de una regla global porque los libros no coinciden (en Lengua el opener de unidad es el pliego 6–7, en Conocimiento parece una página suelta).

### D3. Sin base de datos

Los datos son 45 filas de JSON, 749 imágenes en disco y ~1,2 MB de texto. Sin progreso ni usuarios no hay nada que consultar por clave ni que transaccionar. Express sirve el JSON y los estáticos; el texto OCR se lee bajo demanda del sistema de ficheros con una caché en memoria.

- Alternativa descartada: SQLite (el patrón de `foodapp`). Aportaría búsqueda full-text, pero no hay ninguna función que la use.
- El texto OCR se guarda **un fichero por página** (`data/pages/<libro>/<pagina>.txt`): un tema es un rango contiguo, así que componer su contexto es concatenar ficheros, sin índice ni motor.

### D4. El texto OCR se genera offline, no en tiempo de petición

Generar el texto en el momento de pedir un test metería 3 s/página × 14 páginas de OCR dentro de una petición HTTP. Se precalcula: `npm run ocr -- <libro>` recorre sus páginas, escribe los `.txt` y es reejecutable (salta los que ya existen).

- A 300 dpi y `--psm 3`, el texto de Lengua sale prácticamente limpio.
- Ruido conocido y aceptado: los bullets decorativos se convierten en `e`, `+`, `*` y en Matemáticas se desordena el orden de lectura de las columnas.
- Si el test de Matemáticas sale pobre, la mejora prevista es reconstruir el orden con `tesseract --tsv` y las coordenadas; no se contempla mandar imágenes a un modelo de visión como primera opción, porque el modelo elegido no es multimodal y añadiría coste y latencia.
- **Medido al ejecutarlo**: 749 páginas en 50–105 min por libro corriendo los 4 en paralelo (compiten por los 8 núcleos; en serie habría sido ~40 min por libro), con 3,0 MB de texto en total.
- **Decisión sobre `--tsv`: no hace falta por ahora.** El test del tema 4 de Matemáticas ("Las figuras geométricas") salió con las 8 preguntas correctas y ancladas a las páginas 60–67, pese al desorden de columnas. Se revisará solo si algún tema concreto da preguntas raras.

### D5. Prompts: el rango de páginas es la unidad de trabajo

Los dos prompts reciben **texto ya delimitado por la tabla de temas**, nunca el libro entero:

- Test: texto del rango completo del tema + título + asignatura. Salida JSON estricta con `pregunta`, `opciones[4]`, `correcta`, `explicacion`, `pagina`. El campo `pagina` es lo que permite el "vuelve a la página 14".
- Tutor: por defecto el texto del pliego visible; al ampliar, el del tema. Instrucciones de voz (frases cortas, ejemplos cotidianos, cierre con comprobación) y una restricción explícita de no resolver los ejercicios impresos.

Ambos prompts fijan la fidelidad al texto: si el contenido no da para lo pedido, se recorta la salida antes que inventar. Para el test eso se valida además en servidor (número de preguntas y forma del JSON) y, si no cuadra, se reintenta una vez.

### D6. Una sola puerta a la IA, con la clave en el servidor

El cliente nunca ve la clave: habla con `/api/quiz` y `/api/chat`, y el servidor llama al proxy. La configuración (`LITELLM_BASE_URL`, `LITELLM_API_KEY`, modelo) va en `.env`, que está en `.gitignore`; el modelo por defecto es `nan/deepseek-v4-flash-0731`.

- El chat responde por streaming (SSE) porque la latencia percibida importa más que el tiempo total.
- El test es una llamada no streaming: el resultado se valida entero antes de mostrarlo.

### D7. Cliente sin framework

`public/index.html` + un `app.js` de unos cientos de líneas: cargar catálogo, pintar dos imágenes, gestionar gestos y teclado, precargar vecinos y guardar la posición en `localStorage`. El único estado global es `{libro, pliego}`.

- El panel del tutor y el test se montan sobre la misma página como capas; no hay router ni rutas.
- `localStorage` basta para la memoria de posición: es un dato por dispositivo, no del servidor.

## Risks / Trade-offs

- **Paridad de pliego equivocada en algún libro** → cada pliego saldría desplazado y se romperían las dobles páginas diseñadas como tal. Mitigación: verificación visual de una página por libro antes de dar la tabla por buena, y la paridad es dato del catálogo, así que corregirla no requiere re-renderizar.
- **OCR desordenado en Matemáticas** → el test de esa asignatura puede salir flojo. Mitigación: revisar a mano el primer test de Matemáticas; si no convence, ordenar por `--tsv` antes de tocar prompts.
- **El modelo devuelve JSON inválido o incompleto** → mitigación: validación en servidor y un reintento; si falla, error comprensible en vez de test roto.
- **Latencia del proveedor en el chat** → mitigación: streaming, contexto pequeño por defecto (un pliego) y ampliación explícita al tema.
- **La clave se filtra** → mitigación: solo servidor, `.env` ignorado por git, y rotación de la clave que ya se compartió por chat antes de desplegar.
- **Los derivados ocupan espacio** (132 MB imágenes + 1,2 MB texto) → mitigación: los scripts son reejecutables y los derivados están fuera de git; borrar `data/pages/` y regenerar es barato.
- **El libro completo nunca se expone** → mitigación: `books/` fuera de git y del servidor estático; solo se publican las páginas renderizadas.

## Migration Plan

No hay sistema previo que migrar; el despliegue inicial es:

1. Copiar los PDFs a `books/` (fuera de git).
2. `npm run render` → `data/pages/<libro>/*.webp`.
3. `npm run ocr` → `data/pages/<libro>/*.txt`.
4. Revisar `data/books.json` (45 temas + paridad por libro) contra los índices.
5. `docker compose up -d` y abrir en la tablet.

Rollback: al no haber datos de usuario, volver atrás es parar el contenedor. Los derivados se regeneran en minutos.

## Open Questions

- Número y tono exacto de las preguntas abiertas: la rúbrica se ajustará al ver los primeros tests reales de cada asignatura, sin cambiar specs ni arquitectura.
- Si se añade un fallback de una sola página en orientación vertical: cabe en el cliente actual y puede decidirse cuando se use en la tablet.
