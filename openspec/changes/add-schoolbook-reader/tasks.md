# Tasks

## 1. Base del proyecto

- [ ] 1.1 Crear `package.json` con `express`, y los scripts `start`, `render`, `ocr` y `check`; verificar con `npm install` y `npm run start` sirviendo `public/index.html`
- [ ] 1.2 Añadir `.gitignore` con `node_modules/`, `books/`, `data/pages/`, `.env` y `*.log`; verificar que `git status --short` no lista ni los PDFs ni los derivados
- [ ] 1.3 Levantar el servidor Express que sirve `public/` como estático y `GET /api/books` desde `data/books.json`; verificar con `curl -s localhost:PORT/api/books` devolviendo JSON válido
- [ ] 1.4 Crear `Dockerfile` y `docker-compose.yml` con el puerto publicado y el `.env` inyectado; verificar con `docker compose up -d --build` y un `curl` al contenedor desde la red local
- [ ] 1.5 Crear `.env.example` con `LITELLM_BASE_URL`, `LITELLM_API_KEY` y `LITELLM_MODEL`; verificar que el servidor arranca con un `.env` copiado de ese fichero
- [ ] 1.6 Escribir el `README.md` con los pasos de instalación, render, OCR y arranque; verificar siguiéndolo tal cual desde un clon limpio

## 2. Catálogo y tabla de temas

- [ ] 2.1 Leer las páginas de índice de los 4 libros a resolución real y extraer las 45 filas `{libro, tema, título, inicio}`; verificar el recuento 12 / 12 / 12 / 9 y que los títulos coinciden con el índice impreso
- [ ] 2.2 Escribir `data/books.json` con id, título, total de páginas, paridad de pliego y los 45 temas con `inicio` y `fin`; verificar que el último tema de cada libro termina antes de su sección final ("Historias para leer", "VOCABULARIO CLAVE", "Apéndice")
- [ ] 2.3 Confirmar la paridad de pliego de cada libro abriendo una página de márgenes asimétricos y comparándola con la declarada; verificar que el opener de cada tema cae en la posición izquierda o derecha esperada
- [ ] 2.4 Implementar `GET /api/books` devolviendo catálogo y temas anidados; verificar que un consumidor recibe los 4 libros con sus 45 temas y sus rangos
- [ ] 2.5 Escribir `npm run check` que valide la tabla: 45 temas, rangos dentro del libro, sin solapes, sin huecos y paridad declarada en los 4 libros; verificar que falla si se introduce un solape a propósito

## 3. Pipeline de render

- [ ] 3.1 Implementar `scripts/render.js` con `pdftoppm -r 145` y `convert -quality 82 -define webp:method=6` a `data/pages/<libro>/<pagina>.webp`, saltando lo ya generado; verificar ejecutándolo sobre Religión y contando 98 ficheros
- [ ] 3.2 Ejecutar el render sobre los 4 libros; verificar 749 WebP, dimensiones 1505 × 1876 y tamaño total por debajo de 130 MB
- [ ] 3.3 Servir `data/pages/` como estático con caché larga; verificar en la respuesta el `Cache-Control` de los WebP y una segunda carga sin petición repetida

## 4. Pipeline de OCR

- [ ] 4.1 Implementar `scripts/ocr.js` con `pdftoppm -r 300` + `tesseract -l spa --psm 3` escribiendo un `.txt` por página, idempotente; verificar sobre las páginas 10–12 de Lengua comparando el texto con la imagen
- [ ] 4.2 Ejecutar el OCR sobre los 4 libros y registrar el tiempo total; verificar 749 `.txt` y una muestra de 10 páginas al azar legible
- [ ] 4.3 Evaluar la calidad del OCR en Matemáticas y decidir si hace falta reconstruir el orden con `--tsv`; verificar con una nota corta en `design.md` o en el README y la decisión tomada
- [ ] 4.4 Implementar la composición del texto de un rango de páginas con caché en memoria; verificar con un test que el texto del tema 1 de Lengua contiene el título del tema y las páginas 6 a 23

## 5. Lector de pliego

- [ ] 5.1 Componer el pliego con dos imágenes según la paridad del libro y la proporción del libro; verificar que la página 10 de Lengua se muestra junto a la 11, centradas y sin recortes en 2000 × 1200
- [ ] 5.2 Implementar la navegación por deslizamiento horizontal y por flechas izquierda/derecha; verificar avanzando y retrocediendo 10 pliegos con gesto y con teclado
- [ ] 5.3 Implementar la precarga del pliego siguiente y anterior con corte en los extremos; verificar en la pestaña de red que el pliego vecino ya está descargado antes de pedirlo
- [ ] 5.4 Guardar y restaurar la última posición por libro en `localStorage`; verificar cerrando y reabriendo en dos libros distintos y comprobando que cada uno conserva su pliego
- [ ] 5.5 Resolver la portada y el último pliego impar con el hueco correspondiente; verificar el primer y el último pliego de un libro sin repeticiones ni páginas deformadas
- [ ] 5.6 Mostrar el indicador de posición discreto sin barra de herramientas; verificar que solo es visible el indicador y que desaparece cualquier control tras unos segundos
- [ ] 5.7 Escribir la prueba de humo del lector (abrir libro, avanzar, recargar y recuperar posición) y verificarla en el navegador de la tablet

## 6. Test por tema

- [ ] 6.1 Implementar `POST /api/quiz` que recibe libro y tema, compone el contexto del rango y llama al modelo; verificar con un test que un tema inexistente devuelve error y uno válido devuelve preguntas
- [ ] 6.2 Validar la respuesta del modelo contra el contrato (6 de opción múltiple con 4 opciones y 2 abiertas, todas con explicación y página) y reintentar una vez si no cuadra; verificar con un test que un JSON inválido provoca reintento y que dos inválidos devuelven error comprensible
- [ ] 6.3 Construir la interfaz del test con corrección inmediata de las de opción múltiple y resultado final sin persistencia; verificar haciendo un test completo del tema 1 de Lengua
- [ ] 6.4 Implementar la corrección de las respuestas abiertas con rúbrica y comentario; verificar con tres respuestas de prueba (correcta, incompleta y vacía) que reciben valoraciones distintas y razonadas
- [ ] 6.5 Permitir generar otro test del mismo tema; verificar que dos tests consecutivos no comparten preguntas
- [ ] 6.6 Enlazar la referencia de página de cada pregunta con el lector; verificar que tocar la referencia abre el libro en esa página y pliego
- [ ] 6.7 Comprobar la fidelidad del test de Matemáticas a la primera generación; verificar leyendo las 8 preguntas contra las páginas del tema y anotando cualquier pregunta fuera de contenido

## 7. Tutor guiado

- [ ] 7.1 Implementar `POST /api/chat` con respuesta en streaming (SSE) y contexto del pliego visible; verificar con `curl -N` recibiendo los tokens de forma progresiva
- [ ] 7.2 Redactar las instrucciones del tutor (frases cortas, ejemplos cotidianos, cierre con pregunta de comprobación, no resolver los ejercicios del libro); verificar con tres preguntas de prueba revisadas a mano contra cada regla
- [ ] 7.3 Implementar la ampliación del contexto al tema completo; verificar pidiendo "el tema entero" y comprobando que la respuesta usa contenido de páginas no visibles
- [ ] 7.4 Construir el panel del tutor con las cuatro acciones sugeridas y el texto progresivo; verificar abriendo el panel, tocando cada acción y viendo la respuesta mientras se genera
- [ ] 7.5 Manejar el fallo del modelo conservando la conversación; verificar con el proxy caído: aparece un aviso, el historial sigue ahí y el reintento funciona al volver el servicio

## 8. Integración en la tablet

- [ ] 8.1 Probar el lector en la tablet real de 2000 × 1200 pasando 20 pliegos seguidos; verificar que no hay recortes, saltos ni desplazamientos del pliego
- [ ] 8.2 Revisar la sencillez de la pantalla de lectura; verificar que no hay controles permanentes más allá del indicador y de las entradas al test y al tutor
- [ ] 8.3 Repetir el arranque completo siguiendo solo el README en un directorio limpio; verificar que render, OCR y servidor funcionan sin pasos no documentados

## Workflow follow-up

- Archivar el cambio una vez validado en la tablet y fusionados los deltas en las specs.
