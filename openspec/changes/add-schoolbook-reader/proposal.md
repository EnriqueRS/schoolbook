# Proposal

## Why

Los libros de texto de 5º de primaria (Santillana) existen solo como PDF de 92–211 MB cuyas páginas son imagen vectorizada sin capa de texto: no se pueden leer cómodamente en una tablet ni se puede sacar nada de ellas para estudiar. Un adulto acaba pasando páginas en un visor genérico, y un niño de 10 años no puede repasar un tema por su cuenta.

Este cambio construye un lector propio, ligero y sin interfaz, más dos funciones de estudio (test por tema y tutor conversacional) apoyadas en un modelo accesible por el proxy LiteLLM.

## What Changes

- **Catálogo de libros y temas**: los 4 libros (Lengua, Matemáticas, Conocimiento del Medio, Religión) se segmentan en **45 temas** (`{libro, tema, título, inicio, fin}`) a partir de las páginas de índice impresas. Las páginas entre temas (repaso trimestral, retos) pertenecen al tema anterior.
- **Render de páginas**: cada página del PDF se renderiza una vez a WebP (1505×1876, ~150 KB) y se sirve como estático. Se sustituyen 555 MB de PDF por ~109 MB de imágenes.
- **Lector de pliego**: vista de **dos páginas** en tablet apaisada 2000×1200, sin barra de herramientas, con navegación por deslizamiento y teclado, y memoria de la última página por libro.
- **Texto por página**: pipeline de OCR offline (tesseract `spa` sobre render a 300 dpi) que produce el texto de las 749 páginas como material de trabajo para el modelo. No se muestra al usuario.
- **Test por tema**: generación con IA de 8 preguntas por tema (6 tipo test de 4 opciones + 2 de respuesta corta con rúbrica), sin tiempo, con corrección inmediata y enlace a la página del libro de cada pregunta.
- **Tutor guiado**: chat contextual sobre el pliego que se está viendo, con acciones sugeridas y ampliación al tema completo bajo demanda. Responde en streaming.
- **Sin progreso persistente y sin cuentas**: uso doméstico en red local. Los resultados del test no se guardan.
- Los PDFs originales y los derivados (imágenes, texto OCR) quedan **fuera del repositorio**; sí se versionan el pipeline, la tabla de temas y la configuración.

## Capabilities

### New Capabilities

- `book-library`: catálogo de libros y segmentación en temas, con el rango de páginas de cada tema y la paridad de pliego de cada libro.
- `page-reader`: experiencia de lectura de dos páginas, navegación y memoria de posición.
- `topic-quiz`: generación y corrección de un test por tema, con referencia a la página del libro.
- `page-tutor`: tutor conversacional acotado al pliego actual, ampliable al tema.

### Modified Capabilities

Ninguna: el proyecto no tiene specs previas.

## Impact

- **Código nuevo**: servidor Express con estáticos y cuatro endpoints (`catálogo`, texto por página, generar test, chat con streaming), y un cliente sin build step en `public/`.
- **Datos**: `books/*.pdf` (555 MB) fuera de git; `data/books.json` (45 temas) y `data/pages/<libro>/<pagina>.webp` + `.txt` generados por script y regenerables.
- **Scripts**: `render` (PDF → WebP) y `ocr` (WebP → texto), ambos reejecutables por libro.
- **Dependencias**: `poppler-utils`, `tesseract-ocr` + `tesseract-ocr-spa`, `imagemagick`; Node con `express`. Cliente del proxy LiteLLM (`nan/deepseek-v4-flash-0731`) con credencial en `.env`.
- **Infraestructura**: contenedor Docker expuesto en la red local, sin autenticación, pensado para una tablet.
- **Riesgos conocidos**: la paridad del pliego debe verificarse por libro (en Lengua el opener de unidad es un pliego 6–7; en Cono parece una sola página); el OCR desordena columnas en Matemáticas y ensucia los bullets decorativos. Ninguno bloquea: el texto es material interno para la IA, no texto de referencia.
